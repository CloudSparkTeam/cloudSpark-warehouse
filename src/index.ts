import express from 'express';
import cors from 'cors';

const app = express();
const port = 3002;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend API está sendo executado!');
});

app.listen(port, () => {
  console.log(`Servidor está rodando em http://localhost:${port}`);
});