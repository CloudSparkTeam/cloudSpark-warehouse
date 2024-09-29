import { Router } from "express";

import { default as UsuarioRoutes } from "./UsuarioRoutes";
import { default as ImagemSateliteRoutes } from "./ImagemSateliteRoutes";

const router = Router();

router.use("/usuario", UsuarioRoutes);
router.use("/imagemSatelite", ImagemSateliteRoutes);

export default router;