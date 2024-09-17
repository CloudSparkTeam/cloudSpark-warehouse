import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import router from './routes';

const app = express();
const port = 3002;

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(router);

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
