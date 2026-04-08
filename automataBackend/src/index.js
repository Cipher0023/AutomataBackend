import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { BackendGenerator } from './core/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para analisar o schema sem gerar arquivos
app.post('/api/analyze', async (req, res) => {
  try {
    const { schemaContent } = req.body;
    
    if (!schemaContent) {
      return res.status(400).json({ error: 'Schema Prisma é obrigatório' });
    }

    const generator = new BackendGenerator(schemaContent);
    const analysis = generator.analyze();
    
    res.json(analysis);
  } catch (error) {
    console.error('Erro ao analisar schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para processar o schema e gerar o backend
app.post('/api/generate', async (req, res) => {
  try {
    const { schemaContent, config } = req.body;
    
    if (!schemaContent) {
      return res.status(400).json({ error: 'Schema Prisma é obrigatório' });
    }

    console.log('\n🚀 Iniciando geração do backend...\n');
    
    const generator = new BackendGenerator(schemaContent, config);
    const result = await generator.generate();
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Automata Backend rodando em http://localhost:${PORT}`);
  console.log(`📝 Acesse a interface em: http://localhost:${PORT}`);
});
