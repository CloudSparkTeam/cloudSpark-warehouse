import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const port = 3002;

// Inicializando o Prisma Client
const prisma = new PrismaClient();

app.use(cors());

app.get('/', async (req, res) => {
  try {
    await prisma.$connect();
    res.send('Conexão com o banco de dados bem-sucedida! Backend API está sendo executado.');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).send('Erro ao conectar ao banco de dados.');
  } finally {
    await prisma.$disconnect();
  }
});

app.listen(port, () => {
  console.log(`Servidor está rodando em http://localhost:${port}`);
});
