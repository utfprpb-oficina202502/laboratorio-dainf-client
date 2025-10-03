# 💻 Laboratório DAINF - Frontend

Este repositório contém a aplicação cliente (frontend) para o sistema de gerenciamento de laboratórios do Departamento Acadêmico de Informática (DAINF) da UTFPR - Campus Pato Branco.

A aplicação foi desenvolvida com Angular e se comunica com o backend via uma API RESTful.

---

## 🛠️ Tecnologias Utilizadas

- **Angular v20+**
- **TypeScript**
- **PrimeNG** (Biblioteca de Componentes UI)
- **Tailwind CSS** (Framework CSS Utilitário)
- **RxJS** para programação reativa
- **Signals** para gerenciamento de estado

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos

- **Node.js v20.x**
- **NPM v10.x**
- **Angular CLI** (instalado globalmente)

```bash
npm install -g @angular/cli
```

### 2. Clonar o Repositório

```bash
git clone https://github.com/utfprapps-pb/laboratorio-dainf-client.git
cd laboratorio-dainf-client
```

### 3. Instalar Dependências

Execute o comando a seguir na raiz do projeto para instalar todas as dependências necessárias.

```bash
npm install
```

### 4. Executar o Servidor de Desenvolvimento

Para iniciar o servidor de desenvolvimento local, execute:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:4200/`. O servidor recarregará automaticamente a aplicação sempre que houver alterações nos arquivos.

---

## ⚙️ Configuração de Ambiente

A URL da API do backend é configurada dinamicamente durante o processo de build, utilizando uma variável de ambiente.

### Configuração Dinâmica (Produção/Docker)

Para builds de produção, Docker ou Heroku, a aplicação espera uma variável de ambiente chamada `API_URL`. O script `set-env.js` utiliza essa variável para gerar o arquivo de ambiente correto no momento do build.

**Exemplo de como definir a variável de ambiente antes do build:**
```bash
export API_URL=https://sua-api.exemplo.com
npm run build
```

### Configuração Local (Desenvolvimento)

Para desenvolvimento local, a URL da API pode ser configurada diretamente no arquivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://test-labs-api.app.pb.utfpr.edu.br/' // URL do backend de desenvolvimento/testes
};
```

---

## 📦 Comandos Úteis

- **Build para Produção:**
  ```bash
  npm run build
  ```
  Este comando compila e otimiza a aplicação para produção, gerando os arquivos na pasta `dist/`.

- **Executar o Linter:**
  ```bash
  npm run lint
  ```
  Este comando analisa o código em busca de erros de estilo e potenciais problemas, com base nas regras do ESLint configuradas no projeto.

---

## 📄 Licença

Projeto desenvolvido com fins acadêmicos no âmbito da UTFPR - Campus Pato Branco.
Licenciado sob os termos da licença MIT.

---

## <img src="https://sistemas2.utfpr.edu.br/assets/favicon.svg" alt="UTFPR Logo" width="20" /> Desenvolvido por alunos e professores da UTFPR-PB.

#### A aplicação faz parte do projeto **Bowser: desenvolvimento de softwares de código aberto para a comunidade**.

 - Professor: Vinicius Pegorini
 - Aluno: Gustavo Henrique Lopes Spachuk Zaffani (TCC - Análise e Desenvolvimento de Sistemas)