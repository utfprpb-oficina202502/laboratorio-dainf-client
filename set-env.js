const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname,
  'src/environments/environment.prod.ts');
const ngswConfigPath = path.join(__dirname, 'ngsw-config.json');
const indexHtmlPath = path.join(__dirname, 'src/index.html');

const apiUrl = process.env.API_URL;
const minioUrl = process.env.MINIO_URL;

// Validação da API_URL
if (!apiUrl) {
  console.error('❌ ERRO: A variável de ambiente API_URL não está definida.');
  console.error('O build não pode continuar sem a URL da API para produção.');
  process.exit(1);
}

let normalizedApiUrl;
try {
  normalizedApiUrl = new URL(apiUrl).href;
} catch {
  console.error(
    '❌ ERRO: API_URL inválida. Exemplo esperado: https://api.exemplo.com/');
  process.exit(1);
}

// Validação da MINIO_URL (opcional, usa valor padrão se não definida)
let normalizedMinioUrl;
if (minioUrl) {
  try {
    normalizedMinioUrl = new URL(minioUrl).href;
  } catch {
    console.error(
      '❌ ERRO: MINIO_URL inválida. Exemplo esperado: https://minio.exemplo.com/bucket/');
    process.exit(1);
  }
}

console.log(`-- Configurando a API URL para: ${normalizedApiUrl} --`);
if (normalizedMinioUrl) {
  console.log(`-- Configurando a MINIO URL para: ${normalizedMinioUrl} --`);
}

// Atualiza environment.prod.ts
try {
  let envFileContent = fs.readFileSync(envFilePath, 'utf8');

  /**
   * Regex seguros para propriedades do environment
   * - [^\n]+ é linear (classe simples, sem overlap com $, não causa backtracking)
   * - Flag 'm' para multiline (^ e $ = início/fim de linha)
   * - Substituição sempre adiciona vírgula para garantir sintaxe válida
   */
  const apiRegex = /^(\s*)(api_url:\s*)[^\n]+$/m; // NOSONAR - [^\n]+ é linear, falso positivo
  const minioRegex = /^(\s*)(minio_url:\s*)[^\n]+$/m; // NOSONAR
  const timestampRegex = /^(\s*)(build_timestamp:\s*)[^\n]+$/m; // NOSONAR

  // Atualiza api_url
  let replaced = envFileContent.replace(apiRegex, `$1$2'${normalizedApiUrl}',`);
  if (replaced === envFileContent) {
    console.error(
      '❌ ERRO: Não foi possível localizar a propriedade api_url em environment.prod.ts.');
    process.exit(1);
  }
  console.log(`✓ api_url atualizado para: ${normalizedApiUrl}`);

  // Atualiza minio_url se fornecida
  if (normalizedMinioUrl) {
    const minioReplaced = replaced.replace(minioRegex,
      `$1$2'${normalizedMinioUrl}',`);
    if (minioReplaced === replaced) {
      console.warn(
        '⚠️ AVISO: Não foi possível localizar a propriedade minio_url em environment.prod.ts.');
    } else {
      replaced = minioReplaced;
      console.log(`✓ minio_url atualizado para: ${normalizedMinioUrl}`);
    }
  }

  // Atualiza build_timestamp para forçar invalidação do cache do Service Worker
  const buildTimestamp = Date.now().toString();
  const timestampReplaced = replaced.replace(timestampRegex,
    `$1$2'${buildTimestamp}',`);
  if (timestampReplaced === replaced) {
    console.warn(
      '⚠️ AVISO: Não foi possível localizar build_timestamp em environment.prod.ts.');
    console.warn(
      '   Adicione a propriedade build_timestamp ao arquivo para habilitar invalidação de cache.');
  } else {
    replaced = timestampReplaced;
    console.log(`✓ build_timestamp atualizado para: ${buildTimestamp}`);
  }

  fs.writeFileSync(envFilePath, replaced, 'utf8');
  console.log('✓ environment.prod.ts atualizado com sucesso.');
} catch (err) {
  console.error('❌ ERRO ao tentar modificar o arquivo de ambiente:', err);
  process.exit(1);
}

// Atualiza ngsw-config.json com a URL do MinIO para o Service Worker
if (normalizedMinioUrl) {
  try {
    const ngswConfig = JSON.parse(fs.readFileSync(ngswConfigPath, 'utf8'));
    const minioGroup = ngswConfig.dataGroups?.find(
      g => g.name === 'minio-images');

    if (minioGroup) {
      // Extrai a URL base (protocolo + host) para o wildcard
      const urlObj = new URL(normalizedMinioUrl);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}/**`;

      // Adiciona a URL se ainda não existir
      if (minioGroup.urls.includes(baseUrl)) {
        console.log('✓ ngsw-config.json já contém a URL do MinIO.');
      } else {
        minioGroup.urls.push(baseUrl);
        fs.writeFileSync(ngswConfigPath,
          JSON.stringify(ngswConfig, null, 2) + '\n');
        console.log(`✓ ngsw-config.json atualizado com: ${baseUrl}`);
      }
    } else {
      console.warn(
        '⚠️ AVISO: Grupo "minio-images" não encontrado no ngsw-config.json.');
    }
  } catch (err) {
    console.warn('⚠️ AVISO: Erro ao atualizar ngsw-config.json:', err.message);
  }
}

try {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const apiOrigin = new URL(normalizedApiUrl).origin;
  const minioOrigin = normalizedMinioUrl ? new URL(normalizedMinioUrl).origin
    : '';

  const connectOrigins = [apiOrigin, minioOrigin].filter(Boolean).join(' ');
  const imgOrigin = minioOrigin || '';
  const mediaOrigin = minioOrigin || '';

  let updatedHtml = indexHtml
  .replaceAll('CSP_CONNECT_ORIGINS', connectOrigins)
  .replaceAll('CSP_IMG_ORIGIN', imgOrigin)
  .replaceAll('CSP_MEDIA_ORIGIN', mediaOrigin);

  if (updatedHtml === indexHtml) {
    console.log('✓ index.html CSP já está atualizado.');
  } else {
    fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');
    console.log('✓ index.html atualizado com CSP:');
    console.log(`  - connect-src: 'self' ${connectOrigins}`);
    console.log(`  - img-src: 'self' blob: data: ${imgOrigin}`);
    console.log(`  - media-src: 'self' blob: ${mediaOrigin}`);
  }
} catch (err) {
  console.error('❌ ERRO ao atualizar CSP no index.html:', err.message);
  process.exit(1);
}

