const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const rawApiUrl = (process.env.API_URL || 'http://localhost:8080').trim();
const rawMinioUrl = (process.env.MINIO_URL || 'https://minio.app.pb.utfpr.edu.br').trim();

let apiOrigin;
try {
  apiOrigin = new URL(rawApiUrl).origin;
} catch {
  apiOrigin = null;
}

let minioOrigin;
try {
  minioOrigin = new URL(rawMinioUrl).origin;
} catch {
  minioOrigin = null;
}

const connectSrc = ["'self'", ...(apiOrigin ? [apiOrigin] : [])];
const imgSrc = ["'self'", "blob:", "data:", ...(minioOrigin ? [minioOrigin] : [])];
const mediaSrc = ["'self'", "blob:", ...(minioOrigin ? [minioOrigin] : [])];

const app = express();
const port = process.env.PORT || 4200;

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
console.log('✅ CSP connect-src is being set to:', connectSrc);
console.log('✅ CSP img-src is being set to:', imgSrc);
app.use(helmet({
  contentSecurityPolicy: {
    'useDefaults': true,
    directives: {
      "frameAncestors": ["'none'"],
      "connectSrc": connectSrc,
      "imgSrc": imgSrc,
      "mediaSrc": mediaSrc,
    },
  },
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
