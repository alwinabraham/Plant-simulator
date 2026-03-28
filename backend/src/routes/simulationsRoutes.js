import { Router } from "express";
import { runSimulationController } from "../controllers/simulationsController.js";

const router = Router();

router.post("/run", runSimulationController);

export default router;
