import { Router } from "express";

import { default as UsuarioRoutes } from "./UsuarioRoutes";

const router = Router();

router.use("/usuario", UsuarioRoutes);

export default router;