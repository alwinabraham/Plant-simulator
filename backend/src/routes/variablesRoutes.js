import { Router } from "express";
import { createVariable, listVariables } from "../controllers/variablesController.js";

const router = Router();

router.get("/", listVariables);
router.post("/", createVariable);

export default router;
