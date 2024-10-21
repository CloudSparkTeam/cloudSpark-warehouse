import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import router from './routes';
import { sha512 } from "sha512-crypt-ts";
import path from 'path';

const app = express();
const port = 3002;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(router);
app.use('/imagens_tratadas_ia', express.static(path.join(process.cwd(), 'imagens_tratadas_ia')));


async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log("connected to database");
    const admin = await prisma.usuario.findUnique({ where: { email: "admin@gmail.com" } });
    const user = await prisma.usuario.findUnique({ where: { email: "user@gmail.com" } });

    if (!admin) {
      await prisma.usuario.create({
        data: {
          nome: "admin",
          email: "admin@gmail.com",
          senha: sha512.crypt("123", "password"),
          data_nascimento: "10-02-1997",
        }
      });
      console.log("Usuário admin criado com sucesso.");
    }

    if (!user) {
      await prisma.usuario.create({
        data: {
          nome: "user",
          email: "user@gmail.com",
          senha: sha512.crypt("123", "password"),
          data_nascimento: "10-02-1997",
        }
      });
      console.log("Usuário user criado com sucesso.");
    }

  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();

app.listen(port, () => {
  console.log(`Servidor está rodando em http://localhost:${port}`);
});
