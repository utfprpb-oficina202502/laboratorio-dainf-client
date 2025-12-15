# 💻 Laboratório DAINF - Frontend

Este repositório contém a aplicação cliente (frontend) para o sistema de gerenciamento de laboratórios do Departamento Acadêmico de Informática (DAINF) da UTFPR - Campus Pato Branco.

A aplicação foi desenvolvida com Angular e se comunica com o backend via uma API RESTful.

---

## 🛠️ Tecnologias Utilizadas

- **Angular 20.3.15** - Framework de aplicações web
- **TypeScript 5.9** - Linguagem tipada
- **PrimeNG 20.4.0** (Biblioteca de Componentes UI com tema Aura)
- **Tailwind CSS 3.4.18** (Framework CSS Utilitário)
- **RxJS 7.8.1** para programação reativa
- **Angular Signals** para gerenciamento de estado (223 ocorrências)
- **amCharts5 5.14.2** (Biblioteca de gráficos)
- **Jest 30.2.0** (Framework de testes)
- **Express 5.1.0** (Servidor de produção)

---

## ✨ Funcionalidades Principais

- **Gestão de Empréstimos**: Controle completo do ciclo de empréstimos de equipamentos
- **Gestão de Itens**: Catálogo de equipamentos com visualização em árvore e catálogo
- **Reservas**: Sistema de reservas com carrinho de compras integrado
- **Auditoria**: Histórico completo de alterações com Hibernate Envers (timeline e consulta por entidade)
- **Relatórios**: Dashboard interativo com gráficos e estatísticas em tempo real
- **Nada Consta**: Emissão de declarações de nada consta para alunos
- **PWA**: Aplicação instalável com suporte offline e atualizações automáticas
- **Tema Escuro/Claro**: Alternância de temas com persistência de preferência

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

---

## ⚙️ Configuração de Ambiente

A URL da API do backend é configurada dinamicamente durante o processo de build, utilizando uma variável de ambiente.

### Configuração Dinâmica (Produção/Docker)

Para builds de produção, Docker ou Heroku, a aplicação utiliza variáveis de ambiente. O script `set-env.js` processa essas variáveis para configurar o ambiente correto no momento do build.

#### Variáveis de Ambiente

| Variável    | Obrigatória | Descrição                                              | Exemplo                                  |
|-------------|-------------|--------------------------------------------------------|------------------------------------------|
| `API_URL`   | ✅ Sim       | URL base da API REST do backend                        | `https://api.exemplo.com/`               |
| `MINIO_URL` | ❌ Não       | URL base do bucket MinIO para armazenamento de imagens | `https://minio.exemplo.com:9000/bucket/` |

#### Comportamento

- **`API_URL`**: Atualiza a propriedade `api_url` no `environment.prod.ts`. O build falha se não estiver definida.
- **`MINIO_URL`**: Configura o armazenamento de imagens em três lugares:
  1. **Build (Angular)**: Atualiza `minio_url` no `environment.prod.ts`
  2. **Build (PWA)**: Adiciona a URL no `ngsw-config.json` para cache do Service Worker
  3. **Runtime (Express)**: Configura o CSP (Content-Security-Policy) no `server.js` para permitir carregamento de imagens

  Se não definida, usa o valor padrão: `https://minio.app.pb.utfpr.edu.br/dainf-labs/`

#### Cache do PWA (Service Worker)

O script `set-env.js` também atualiza automaticamente o `build_timestamp` no `environment.prod.ts` a cada build. Isso garante que o Service Worker do PWA sempre detecte uma nova versão, mesmo quando apenas configurações do servidor (CSP, etc.) são alteradas.

**Exemplo de como definir as variáveis de ambiente antes do build:**
```bash
export API_URL=https://sua-api.exemplo.com/
export MINIO_URL=https://seu-minio.exemplo.com:9000/bucket/
npm run build
```

**Ou em uma única linha:**

```bash
API_URL=https://sua-api.exemplo.com/ MINIO_URL=https://seu-minio.exemplo.com:9000/bucket/ npm run build
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

## 🧪 Testes

A aplicação utiliza **Jest 30** como framework de testes.

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes com relatório de cobertura (CI)
npm run test:ci
```

## 📄 Licença

Projeto desenvolvido com fins acadêmicos no âmbito da UTFPR - Campus Pato Branco.
Licenciado sob os termos da licença MIT.

---

## <img src="https://sistemas2.utfpr.edu.br/assets/favicon.svg" alt="UTFPR Logo" width="20" /> Desenvolvido por alunos e professores da UTFPR-PB.

#### A aplicação faz parte do projeto **Bowser: desenvolvimento de softwares de código aberto para a comunidade**.

 - Professor: Vinicius Pegorini
 - Aluno: Gustavo Henrique Lopes Spachuk Zaffani (TCC - Análise e Desenvolvimento de Sistemas)
