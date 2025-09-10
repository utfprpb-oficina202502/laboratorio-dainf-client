const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname, 'src/environments/environment.prod.ts');
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.error('❌ ERRO: A variável de ambiente API_URL não está definida.');
  console.error('O build não pode continuar sem a URL da API para produção.');
  process.exit(1);
}

console.log(`-- Configurando a API URL para: ${apiUrl} --`);

try {
  // Lê o conteúdo do arquivo de ambiente
  let envFileContent = fs.readFileSync(envFilePath, 'utf8');
  const regex = /(api_url:\s*['"])([^'"]*)(['"],?)/;
  envFileContent = envFileContent.replace(regex, `$1${apiUrl}$3`);
  fs.writeFileSync(envFilePath, envFileContent, 'utf8');
  console.log('✅ Arquivo environment.prod.ts atualizado com sucesso.');
} catch (err) {
  console.error('❌ ERRO ao tentar modificar o arquivo de ambiente:', err);
  process.exit(1);
}

