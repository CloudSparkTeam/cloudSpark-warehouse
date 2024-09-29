import { Router } from 'express';
import ImagemSateliteController from '../controllers/ImagemSateliteController';

const routes = Router();

routes.post('/criar', ImagemSateliteController.criarImagemSatelite);
routes.get('/listar', ImagemSateliteController.listarImagensSatelite);
routes.get('/listar/:id', ImagemSateliteController.obterImagemSatelitePorId);
routes.put('/atualizar/:id', ImagemSateliteController.atualizarImagemSatelite);
routes.delete('/deletar/:id', ImagemSateliteController.excluirImagemSatelite);
routes.get('/imagens-tratadas', ImagemSateliteController.listarImagensTratadas);

export default routes;
