# Automata Backend

Gerador automatizado de backends Node/Express baseado em schemas Prisma.

## Funcionalidades

- Leitura e parsing de arquivos `schema.prisma`
- Geração automática de controllers (CRUD completo)
- Geração automática de services com validações
- Geração de rotas públicas e privadas
- Sistema de autenticação e proteção de rotas
- Estrutura baseada no padrão do backend Sasaki Tintas

## Como usar

1. Instale as dependências:
```bash
npm install
```

2. Execute o gerador:
```bash
npm run dev
```

3. Acesse a interface web em `http://localhost:3000`

4. Faça upload do seu `schema.prisma` ou cole o conteúdo

5. Configure os modelos e gere o backend completo

## Estrutura gerada

```
output/
├── controllers/
│   ├── [model]/
│   │   ├── reg[Model]Cnt.js
│   │   ├── fnd[Model]Cnt.js
│   │   ├── lst[Model]Cnt.js
│   │   ├── upd[Model]Cnt.js
│   │   └── del[Model]Cnt.js
├── services/
│   └── [model]/
│       └── all[Model]Srv.js
├── routes/
│   ├── public/
│   └── private/
├── middlewares/
├── configs/
└── prisma/
    └── schema.prisma
```

## Tecnologias

- Node.js
- Express
- Prisma
