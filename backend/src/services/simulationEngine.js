export function runSimulation({
  days = 30,
  variables = {},
  weights = {},
} = {}) {
  const levelScore = { low: -1, medium: 0, high: 1 };
  const defaultWeight = 0.1;

  let safeDays = Number(days) || 1;
  if (safeDays < 1) safeDays = 1;
  if (safeDays > 365) safeDays = 365;

  const levelsByKey = {};
  for (const key in variables) {
    const raw = String(variables[key] || "").toLowerCase();
    levelsByKey[key] = levelScore[raw] !== undefined ? raw : "medium";
  }

  let health = 80;
  let stress = 20;
  let growth = 5;
  const history = [];

  for (let day = 1; day <= safeDays; day += 1) {
    let conditionBalance = 0;
    for (const key in levelsByKey) {
      const level = levelsByKey[key];
      const weight = Number.isFinite(weights[key]) ? weights[key] : defaultWeight;
      conditionBalance += levelScore[level] * weight;
    }

    let healthChange = 0;
    let stressChange = 0;
    let growthChange = 0;
    const stressRatio = stress / 100;

    if (conditionBalance < 0) {
      stressChange += 6 * Math.abs(conditionBalance);
    }
    if (conditionBalance > 0) {
      growthChange += 5 * conditionBalance;
    }
    growthChange += 1.5;
    growthChange += -4 * stressRatio;
    healthChange += -2 * stressRatio;
    healthChange += 2.5 * conditionBalance;
    if (stress > 70) {
      healthChange += -1.5;
    }
    if (stress > 85) {
      growthChange += -growth * 0.1;
    }

    health = health + healthChange + (Math.random() * 2 - 1) * 0.5;
    stress = stress + stressChange + (Math.random() * 2 - 1) * 1;
    growth = growth + growthChange + (Math.random() * 2 - 1) * 0.3;

    if (health < 0) health = 0;
    if (health > 100) health = 100;
    if (stress < 0) stress = 0;
    if (stress > 100) stress = 100;
    if (growth < 0) growth = 0;
    if (growth > 100) growth = 100;

    history.push({
      day,
      health: Number(health.toFixed(2)),
      stress: Number(stress.toFixed(2)),
      growth: Number(growth.toFixed(2)),
    });
  }

  const last = history[history.length - 1];

  return {
    input: {
      days: safeDays,
      variables: levelsByKey,
      weights,
    },
    summary: {
      finalHealth: last?.health ?? 0,
      finalStress: last?.stress ?? 0,
      finalGrowth: last?.growth ?? 0,
    },
    history,
  };
}
