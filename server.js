const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 4200;

// ============================================================================
// CSP - Content Security Policy (configurado via variáveis de ambiente)
// ============================================================================
const apiUrl = process.env.API_URL;
const minioUrl = process.env.MINIO_URL;

// Validação obrigatória da API_URL (existência e formato)
if (!apiUrl) {
  console.error('❌ ERRO: A variável de ambiente API_URL não está definida.');
  console.error('   O servidor não pode iniciar sem a URL da API para o CSP.');
  console.error('   Configure API_URL no Heroku ou no ambiente local.');
  console.error('   Exemplo: API_URL=https://api.exemplo.com/');
  process.exit(1);
}

try {
  new URL(apiUrl);
} catch {
  console.error(
    '❌ ERRO: API_URL inválida. Formato esperado: https://api.exemplo.com/');
  console.error(`   Valor recebido: ${apiUrl}`);
  process.exit(1);
}

/**
 * Extrai a origem (protocol + host) de uma URL
 * @param {string} url - URL completa
 * @returns {string|null} - Origem ou null se inválida
 */
function extractOrigin(url) {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    console.warn(`⚠️ URL inválida ignorada para CSP: ${url}`);
    return null;
  }
}

const apiOrigin = extractOrigin(apiUrl);
const minioOrigin = extractOrigin(minioUrl);

// Monta as origens para cada diretiva
const connectSrcOrigins = [apiOrigin, minioOrigin].filter(Boolean);
const imgSrcOrigins = [minioOrigin].filter(Boolean);
const mediaSrcOrigins = [minioOrigin].filter(Boolean);

console.log('🔒 CSP configurado:');
console.log(`   connect-src: 'self' ${connectSrcOrigins.join(' ')
|| '(nenhuma origem externa)'}`);
console.log(`   img-src: 'self' blob: data: ${imgSrcOrigins.join(' ')
|| '(nenhuma origem externa)'}`);
console.log(`   media-src: 'self' blob: ${mediaSrcOrigins.join(' ')
|| '(nenhuma origem externa)'}`);

const appName = process.env.APP_NAME || 'tcc-client';
const distRoot = path.join(__dirname, 'dist');
const candidatePaths = [
  process.env.OUTPUT_PATH,
  path.join(distRoot, appName, 'browser'),
  path.join(distRoot, appName),
  path.join(distRoot, 'browser'),
  distRoot
].filter(Boolean);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // limita request por IP
  standardHeaders: true, // Retorna info do rate limit no header `RateLimit-*`
  legacyHeaders: false, // Desabilita o header `X-RateLimit-*`
});

const outputPath = candidatePaths.find(p =>
  fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))
);

if (!outputPath) {
  console.error(
    '❌ ERRO: Não foi possível localizar o diretório de build com um index.html válido.');
  console.error('Caminhos verificados:', candidatePaths);
  process.exit(1);
}
console.log(`✅ Serving files from: ${outputPath}`);

app.set('trust proxy', 1);
app.use(compression());
app.disable('x-powered-by');

// =============================================================================
// Helmet Security Headers
// NOTA: 'unsafe-inline' em style-src é necessário porque:
// - Angular injeta estilos dinamicamente via ComponentStyle
// - PrimeNG usa estilos inline em componentes (p-dialog, p-table, etc.)
// - Remover exigiria implementar nonces CSP, que requer SSR ou middleware complexo
// Risco mitigado: CSS injection é menos crítico que script injection, e Angular
// sanitiza bindings de estilo automaticamente.
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'blob:', 'data:', ...imgSrcOrigins],
      mediaSrc: ["'self'", 'blob:', ...mediaSrcOrigins],
      connectSrc: ["'self'", ...connectSrcOrigins],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // Equivalente a X-Frame-Options: DENY
      upgradeInsecureRequests: [] // Força HTTPS
    }
  },
  frameguard: {action: 'deny'},
  hsts: {maxAge: 31536000, includeSubDomains: true}, // 1 ano de HSTS
  noSniff: true,
  referrerPolicy: {policy: 'strict-origin-when-cross-origin'}
}));

// cache
app.use((req, res, next) => {
  const filePath = req.path;

  // exclusão do pwa do cache
  const isPWAFile = /\/(ngsw\.json|ngsw-worker\.js|manifest\.webmanifest|safety-worker\.js)$/i.test(
    filePath);

  const isHashedFile = /\.[a-f0-9]{16,}\.(js|css)$/i.test(filePath);

  const isStaticAsset = /\.(jpg|jpeg|png|gif|svg|webp|woff2?|ttf|eot|ico)$/i.test(
    filePath);

  if (isPWAFile) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': filePath.endsWith('.json') ? 'application/json' :
        filePath.endsWith('.webmanifest') ? 'application/manifest+json' :
          'application/javascript'
    });
  } else if (isHashedFile) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (isStaticAsset) {
    res.set('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

app.use(express.static(outputPath, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Additional headers for specific file types can go here
  }
}));

app.get(/.*/, limiter, function (req, res) {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(outputPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server listening on ${port} | static: ${outputPath}`);
});
