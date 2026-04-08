import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Classe responsável por escrever os arquivos gerados
 */
export class FileWriter {
  constructor(outputDir = 'output') {
    this.outputDir = path.join(process.cwd(), outputDir);
  }

  /**
   * Cria um diretório se não existir
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Escreve um arquivo
   */
  writeFile(filePath, content) {
    const fullPath = path.join(this.outputDir, filePath);
    const dir = path.dirname(fullPath);
    
    this.ensureDir(dir);
    fs.writeFileSync(fullPath, content, 'utf8');
    
    return fullPath;
  }

  /**
   * Escreve todos os controllers de um model
   */
  writeControllers(modelName, controllers) {
    const modelLower = modelName.toLowerCase();
    const files = [];

    for (const [type, content] of Object.entries(controllers)) {
      const abbr = this.getAbbreviation(modelName);
      const abbrCap = abbr.charAt(0).toUpperCase() + abbr.slice(1);
      
      let prefix = '';
      switch(type) {
        case 'register': prefix = 'reg'; break;
        case 'find': prefix = 'fnd'; break;
        case 'list': prefix = 'lst'; break;
        case 'update': prefix = 'upd'; break;
        case 'delete': prefix = 'del'; break;
      }

      const fileName = `${prefix}${abbrCap}Cnt.js`;
      const filePath = `controllers/${modelLower}/${fileName}`;
      
      files.push(this.writeFile(filePath, content));
    }

    return files;
  }

  /**
   * Escreve o service de um model
   */
  writeService(modelName, serviceContent) {
    const modelLower = modelName.toLowerCase();
    const abbr = this.getAbbreviation(modelName);
    const abbrCap = abbr.charAt(0).toUpperCase() + abbr.slice(1);
    
    const fileName = `all${abbrCap}Srv.js`;
    const filePath = `services/${modelLower}/${fileName}`;
    
    return this.writeFile(filePath, serviceContent);
  }

  /**
   * Escreve os arquivos de rotas
   */
  writeRoutes(publicRoutes, privateRoutes, privateIndex, publicIndex) {
    const files = [];
    
    files.push(this.writeFile('routes/public/publicRts.js', publicRoutes));
    files.push(this.writeFile('routes/public/public.js', publicIndex));
    files.push(this.writeFile('routes/private/userPrvRte.js', privateRoutes));
    files.push(this.writeFile('routes/private/private.js', privateIndex));
    
    return files;
  }

  /**
   * Copia o schema.prisma para o output
   */
  writeSchema(schemaContent) {
    return this.writeFile('prisma/schema.prisma', schemaContent);
  }

  /**
   * Cria o arquivo prismaClient.js
   */
  writePrismaClient() {
    const content = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
`;
    return this.writeFile('prisma/prismaClient.js', content);
  }

  /**
   * Cria o arquivo server.js principal
   */
  writeServerFile() {
    const content = `import express from "express";
import cors from "cors";
import publicRoutes from "./routes/public/public.js";
import privateRoutes from "./routes/private/private.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/public", publicRoutes);
app.use("/api/private", privateRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API funcionando!" });
});

app.listen(PORT, () => {
  console.log(\`🚀 Servidor rodando na porta \${PORT}\`);
});
`;
    return this.writeFile('server.js', content);
  }

  /**
   * Cria o package.json
   */
  writePackageJson() {
    const content = `{
  "name": "generated-backend",
  "version": "1.0.0",
  "description": "Backend gerado automaticamente pelo Automata Backend",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
`;
    return this.writeFile('package.json', content);
  }

  /**
   * Cria o arquivo .env de exemplo
   */
  writeEnvExample() {
    const content = `DATABASE_URL="mongodb://localhost:27017/mydb"
JWT_SECRET="your-secret-key-here"
PORT=5000
`;
    return this.writeFile('.env.example', content);
  }

  /**
   * Cria o README.md do projeto gerado
   */
  writeReadme() {
    const content = `# Backend Gerado

Este backend foi gerado automaticamente pelo Automata Backend.

## Instalação

\`\`\`bash
npm install
\`\`\`

## Configuração

1. Copie o arquivo \`.env.example\` para \`.env\`
2. Configure a URL do banco de dados MongoDB
3. Configure o JWT_SECRET

## Executar

\`\`\`bash
# Gerar o Prisma Client
npx prisma generate

# Iniciar o servidor
npm run dev
\`\`\`

## Estrutura

- \`controllers/\` - Controllers com lógica de requisição/resposta
- \`services/\` - Services com lógica de negócio
- \`routes/\` - Definição de rotas públicas e privadas
- \`prisma/\` - Schema e client do Prisma
- \`server.js\` - Arquivo principal do servidor

## Rotas

### Públicas
- GET \`/api/public/fnd[Model]\` - Buscar por ID
- GET \`/api/public/lst[Model]\` - Listar todos

### Privadas
- POST \`/api/private/user/reg[Model]\` - Criar
- GET \`/api/private/user/fnd[Model]\` - Buscar por ID
- GET \`/api/private/user/lst[Model]\` - Listar todos
- PUT \`/api/private/user/upd[Model]\` - Atualizar
- DELETE \`/api/private/user/del[Model]\` - Deletar
`;
    return this.writeFile('README.md', content);
  }

  /**
   * Gera abreviação de 3 letras
   */
  getAbbreviation(name) {
    const cleaned = name.replace(/_/g, '');
    if (cleaned.length <= 3) return cleaned.toLowerCase();
    
    const letters = cleaned.split('');
    let abbr = letters[0].toLowerCase();
    
    for (let i = 1; i < letters.length && abbr.length < 3; i++) {
      const char = letters[i].toLowerCase();
      if (!'aeiou'.includes(char)) {
        abbr += char;
      }
    }
    
    while (abbr.length < 3 && letters.length > abbr.length) {
      abbr += letters[abbr.length].toLowerCase();
    }
    
    return abbr.substring(0, 3);
  }

  /**
   * Retorna o caminho do diretório de output
   */
  getOutputDir() {
    return this.outputDir;
  }
}
