import { prisma } from "../lib/prisma.js";
import { runSimulation } from "../services/simulationEngine.js";

const ALLOWED_LEVELS = new Set(["low", "medium", "high"]);

export async function runSimulationController(req, res, next) {
  try {
    const days = Number(req.body?.days);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: "days must be an integer between 1 and 365" });
    }

    const incomingVariables = req.body?.variables;
    if (incomingVariables == null || typeof incomingVariables !== "object") {
      return res.status(400).json({ error: "variables must be an object" });
    }

    const knownVariables = await prisma.variable.findMany({
      select: { key: true, weight: true },
    });

    const normalizedVariables = {};
    const variableWeights = {};
    for (const variable of knownVariables) {
      const key = variable.key;
      const value = String(incomingVariables[key] ?? "medium").toLowerCase();
      normalizedVariables[key] = ALLOWED_LEVELS.has(value) ? value : "medium";
      variableWeights[key] = Number.isFinite(variable.weight) ? variable.weight : 0.1;
    }

    const result = runSimulation({
      days,
      variables: normalizedVariables,
      weights: variableWeights,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
