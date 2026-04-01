import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getVariables, runSimulation } from "../services/api.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

/** Healthy growth ladder (0–100). Swap `imageSrc` when you have assets. */
const PLANT_LIFECYCLE_STAGES = [
  {
    key: "seed",
    min: 0,
    label: "Seed",
    emoji: "🫘",
    blurb: "Waiting underground — growth score is still low.",
    imageSrc: null,
  },
  {
    key: "sprout",
    min: 20,
    label: "Sprout",
    emoji: "🌱",
    blurb: "First green — the preview sees early upward push.",
    imageSrc: null,
  },
  {
    key: "seedling",
    min: 40,
    label: "Seedling",
    emoji: "🌿",
    blurb: "Leaves and structure — room to grow if stress stays tame.",
    imageSrc: null,
  },
  {
    key: "established",
    min: 60,
    label: "Established",
    emoji: "🪴",
    blurb: "A solid plant — strength shows in the growth line.",
    imageSrc: null,
  },
  {
    key: "blooming",
    min: 80,
    label: "Blooming",
    emoji: "🌸",
    blurb: "Peak display — high growth in this toy model.",
    imageSrc: null,
  },
];

/** When stress wins or health collapses, these override the growth ladder (checked worst-first). */
const PLANT_DISTRESS_STAGES = {
  dead: {
    key: "dead",
    label: "Spent",
    emoji: "🪦",
    blurb:
      "Health bottomed out or stress stayed extreme — this preview treats the plant as done for the run.",
    imageSrc: null,
  },
  dying: {
    key: "dying",
    label: "Dying back",
    emoji: "🥀",
    blurb: "Critical strain: very low health or stress is overwhelming growth in this simple model.",
    imageSrc: null,
  },
  fading: {
    key: "fading",
    label: "Fading",
    emoji: "🍂",
    blurb: "Stress is high or health is slipping; growth can’t keep pace the way it would in a good week.",
    imageSrc: null,
  },
  wilting: {
    key: "wilting",
    label: "Wilting",
    emoji: "🍃",
    blurb: "Stress is up and growth is held back — the kind of stretch where leaves start to show it.",
    imageSrc: null,
  },
};

const DISTRESS_STAGE_KEYS = new Set(["dead", "dying", "fading", "wilting"]);

function clampScore(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function plantStageFromGrowth(rawGrowth) {
  const g = clampScore(rawGrowth);
  let stage = PLANT_LIFECYCLE_STAGES[0];
  for (const s of PLANT_LIFECYCLE_STAGES) {
    if (g >= s.min) stage = s;
  }
  return stage;
}

/**
 * One lifecycle frame from a history row. High stress / low health override growth-based stages
 * so bad runs show wilting → fading → dying → spent instead of “blooming” on a low growth number alone.
 */
function plantLifecycleFromRow(row) {
  const h = clampScore(row?.health);
  const s = clampScore(row?.stress);
  const g = clampScore(row?.growth);

  if (h < 14 || (h < 28 && s >= 93)) return PLANT_DISTRESS_STAGES.dead;
  if (h < 36 || s >= 88) return PLANT_DISTRESS_STAGES.dying;
  if (s >= 78 || h < 44 || (s >= 64 && g < 32)) return PLANT_DISTRESS_STAGES.fading;
  if ((s >= 58 && g < 38) || (s >= 52 && g < 26)) return PLANT_DISTRESS_STAGES.wilting;

  return plantStageFromGrowth(g);
}

/** Evenly sample history; dedupes indices so the strip never grows past `maxPoints` wide. */
function sampleHistoryForTimeline(history, maxPoints = 12) {
  if (!Array.isArray(history) || history.length === 0) return [];
  const last = history.length - 1;
  const indices = new Set();
  if (history.length <= maxPoints) {
    for (let i = 0; i < history.length; i += 1) indices.add(i);
  } else {
    for (let i = 0; i < maxPoints; i += 1) {
      indices.add(Math.round((i / (maxPoints - 1)) * last));
    }
  }
  return [...indices]
    .sort((a, b) => a - b)
    .map((idx) => history[idx]);
}

function lifecycleMilestones(history) {
  if (!Array.isArray(history) || history.length === 0) return [];
  const milestones = [];
  let prevKey = null;
  for (const row of history) {
    const stage = plantLifecycleFromRow(row);
    if (stage.key !== prevKey) {
      milestones.push({ day: row.day, stage });
      prevKey = stage.key;
    }
  }
  return milestones;
}

function buildChartOptions(pointCount) {
  const n = Number(pointCount) || 0;
  const maxTicks =
    n > 240 ? 8 : n > 120 ? 10 : n > 60 ? 12 : 14;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          title(items) {
            return items[0]?.label ?? "";
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: n > 80 ? 55 : 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: maxTicks,
        },
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Score (0–100)",
          font: { size: 11 },
        },
      },
    },
  };
}

export default function SimulatorPage() {
  const [variables, setVariables] = useState([]);
  const [days, setDays] = useState(7);
  const [selectedLevels, setSelectedLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [runError, setRunError] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function loadVariables() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await getVariables();
        setVariables(Array.isArray(data) ? data : []);
      } catch (e) {
        setFetchError(e.message ?? "We couldn’t load your conditions. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    }

    loadVariables();
  }, []);

  const effectiveSelection = useMemo(() => {
    const levels = {};
    for (const variable of variables) {
      levels[variable.key] = selectedLevels[variable.key] || "medium";
    }
    return levels;
  }, [variables, selectedLevels]);

  function handleLevelChange(key, value) {
    setSelectedLevels((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setRunError(null);
    setRunning(true);
    try {
      const payload = {
        days: Number(days) || 1,
        variables: effectiveSelection,
      };
      const result = await runSimulation(payload);
      setSimulationResult(result);
    } catch (e) {
      setRunError(e.message ?? "The preview couldn’t run. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const chartData = useMemo(() => {
    const history = simulationResult?.history;
    if (!Array.isArray(history) || history.length === 0) return null;
    return {
      labels: history.map((h) => `Day ${h.day}`),
      datasets: [
        {
          label: "Plant health",
          data: history.map((h) => h.health),
          borderColor: "#2d5a27",
          backgroundColor: "rgba(45, 90, 39, 0.2)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: history.length > 20 ? 0 : 3,
        },
        {
          label: "Stress",
          data: history.map((h) => h.stress),
          borderColor: "#b42318",
          backgroundColor: "rgba(180, 35, 24, 0.15)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: history.length > 20 ? 0 : 3,
        },
        {
          label: "Growth",
          data: history.map((h) => h.growth),
          borderColor: "#1f4f7a",
          backgroundColor: "rgba(31, 79, 122, 0.15)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: history.length > 20 ? 0 : 3,
        },
      ],
    };
  }, [simulationResult]);

  const lifecyclePreview = useMemo(() => {
    const history = simulationResult?.history;
    if (!Array.isArray(history) || history.length === 0) return null;
    const lastRow = history[history.length - 1];
    const finalGrowth =
      simulationResult.summary?.finalGrowth ?? lastRow?.growth ?? 0;
    const finalHealth =
      simulationResult.summary?.finalHealth ?? lastRow?.health ?? 0;
    const finalStress =
      simulationResult.summary?.finalStress ?? lastRow?.stress ?? 0;
    const finalStage = plantLifecycleFromRow(lastRow);
    const timeline = sampleHistoryForTimeline(history).map((row) => ({
      day: row.day,
      growth: row.growth,
      health: row.health,
      stress: row.stress,
      stage: plantLifecycleFromRow(row),
    }));
    return {
      finalGrowth,
      finalHealth,
      finalStress,
      finalStage,
      timeline,
      milestones: lifecycleMilestones(history),
      lastDay: lastRow?.day ?? history.length,
    };
  }, [simulationResult]);

  const chartOptionsResolved = useMemo(
    () => buildChartOptions(simulationResult?.history?.length ?? 0),
    [simulationResult?.history?.length],
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4b5249] sm:text-xs">
          Preview
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#191c19] sm:mt-2 sm:text-4xl lg:text-5xl">
          See how your plant might respond
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#4b5249] sm:mt-4 sm:text-base">
          Pick Low, Normal, or High for each condition and how many days to look ahead. Anything you
          leave on Normal is treated as a typical, middle setting.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:gap-8">
        <section className="min-w-0 rounded-2xl bg-[#e7f0e3] p-5 sm:p-6 lg:p-7">
          <h2 className="text-sm font-semibold text-[#191c19] sm:text-base">Your choices</h2>
          <p className="mt-1 text-xs text-[#4b5249] sm:text-sm">
            These are simple labels for the preview—not a real forecast for a specific crop.
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div>
              <label
                htmlFor="days"
                className="block text-sm font-medium text-[#191c19]"
              >
                How many days?
              </label>
              <p className="mt-0.5 text-xs text-[#5c655c]">Between 1 and 365.</p>
              <input
                id="days"
                type="number"
                min={1}
                max={365}
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-2 min-h-[48px] w-full max-w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-base text-[#191c19] outline-none transition focus:border-[#154212] sm:max-w-xs sm:text-sm"
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <p className="text-sm text-[#4b5249]">Loading your conditions…</p>
              ) : fetchError ? (
                <p className="rounded-xl bg-[#dce8d6] px-4 py-3 text-sm text-[#8b2a2a]" role="alert">
                  {fetchError}
                </p>
              ) : variables.length === 0 ? (
                <p className="rounded-xl bg-[#f0f6ed] px-4 py-6 text-sm leading-relaxed text-[#4b5249]">
                  You don&apos;t have any conditions yet. Go to{" "}
                  <span className="font-medium text-[#103a10]">Conditions</span> in the menu and add
                  a few first.
                </p>
              ) : (
                variables.map((variable) => (
                  <div
                    key={variable.id}
                    className="flex flex-col gap-3 rounded-xl bg-[#dce8d6] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#191c19]">{variable.name}</p>
                      <p className="mt-0.5 text-xs text-[#4b5249] sm:text-sm">
                        Importance in preview:{" "}
                        <span className="font-medium text-[#315131]">
                          {Number(variable.weight ?? 0.1).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div className="w-full sm:w-[min(100%,12rem)] sm:shrink-0">
                      <label
                        htmlFor={`level-${variable.id}`}
                        className="sr-only"
                      >
                        Level for {variable.name}
                      </label>
                      <select
                        id={`level-${variable.id}`}
                        value={selectedLevels[variable.key] || ""}
                        onChange={(e) => handleLevelChange(variable.key, e.target.value)}
                        className="min-h-[48px] w-full rounded-xl border border-[#a8bea1]/40 bg-[#edf5ea] px-3 py-3 text-base text-[#191c19] outline-none focus:border-[#154212] sm:text-sm"
                      >
                        <option value="">Normal</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            {runError && (
              <p className="rounded-xl bg-[#dce8d6] px-4 py-3 text-sm text-[#8b2a2a]" role="alert">
                {runError}
              </p>
            )}

            <button
              type="submit"
              disabled={running || variables.length === 0}
              className="min-h-[48px] w-full rounded-xl bg-gradient-to-br from-[#154212] to-[#2d5a27] px-5 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              {running ? "Working on it…" : "Show me the chart"}
            </button>
          </form>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl bg-[#e7f0e3] p-5 sm:p-6 lg:p-7">
          <h2 className="text-sm font-semibold text-[#191c19] sm:text-base">Preview results</h2>
          <p className="mt-1 text-xs text-[#4b5249] sm:text-sm">
            Simple scores over time—useful for comparing scenarios, not for real farming decisions.
          </p>
          {!simulationResult ? (
            <p className="mt-4 rounded-xl bg-[#f0f6ed] px-4 py-6 text-sm leading-relaxed text-[#4b5249]">
              Fill in the form above and tap <span className="font-medium text-[#103a10]">Show me the chart</span>{" "}
              to see health, stress, and growth lines.
            </p>
          ) : (
            <div className="mt-4 min-w-0 space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f0f6ed] px-3 py-3 sm:py-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#4b5249] sm:text-xs">
                    Health (end)
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-[#2d5a27] sm:text-2xl">
                    {simulationResult.summary.finalHealth}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f0f6ed] px-3 py-3 sm:py-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#4b5249] sm:text-xs">
                    Stress (end)
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-[#b42318] sm:text-2xl">
                    {simulationResult.summary.finalStress}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f0f6ed] px-3 py-3 sm:py-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#4b5249] sm:text-xs">
                    Growth (end)
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-[#1f4f7a] sm:text-2xl">
                    {simulationResult.summary.finalGrowth}
                  </p>
                </div>
              </div>

              <div className="h-[min(50vh,20rem)] min-h-[220px] w-full min-w-0 max-w-full rounded-xl bg-[#f0f6ed] p-2 sm:h-[min(24rem,45vh)] sm:min-h-[280px] sm:p-3 lg:h-96 lg:max-h-[28rem]">
                {chartData && <Line data={chartData} options={chartOptionsResolved} />}
              </div>

              {lifecyclePreview && (
                <div className="min-w-0 space-y-4 border-t border-[#c9dcc0]/60 pt-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#191c19]">Lifecycle snapshot</h3>
                    <p className="mt-1 text-xs text-[#4b5249] sm:text-sm">
                      Stages use <span className="font-medium text-[#315131]">growth</span> when things are
                      okay. If <span className="font-medium text-[#b42318]">stress</span> climbs or{" "}
                      <span className="font-medium text-[#2d5a27]">health</span> drops, the preview shifts
                      through wilting, fading, dying back, and spent.
                    </p>
                  </div>

                  <div
                    className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5 ${
                      DISTRESS_STAGE_KEYS.has(lifecyclePreview.finalStage.key)
                        ? "border-[#c9a090]/50 bg-[#f4ebe6]"
                        : "border-[#a8bea1]/25 bg-[#f0f6ed]"
                    }`}
                  >
                    <div className="flex shrink-0 justify-center sm:w-28">
                      {lifecyclePreview.finalStage.imageSrc ? (
                        <img
                          src={lifecyclePreview.finalStage.imageSrc}
                          alt=""
                          className="h-24 w-24 object-contain"
                        />
                      ) : (
                        <span
                          className="text-[4.5rem] leading-none sm:text-[5rem]"
                          aria-hidden
                        >
                          {lifecyclePreview.finalStage.emoji}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4b5249]">
                        End of run — day {lifecyclePreview.lastDay}
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#103a10] sm:text-2xl">
                        {lifecyclePreview.finalStage.label}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#4b5249]">
                        {lifecyclePreview.finalStage.blurb}
                      </p>
                      <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs tabular-nums text-[#315131] sm:justify-start">
                        <span>
                          Health{" "}
                          <span className="font-semibold text-[#2d5a27]">
                            {Number(lifecyclePreview.finalHealth).toFixed(1)}
                          </span>
                        </span>
                        <span>
                          Stress{" "}
                          <span className="font-semibold text-[#b42318]">
                            {Number(lifecyclePreview.finalStress).toFixed(1)}
                          </span>
                        </span>
                        <span>
                          Growth{" "}
                          <span className="font-semibold text-[#1f4f7a]">
                            {Number(lifecyclePreview.finalGrowth).toFixed(1)}
                          </span>
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-2 text-xs font-medium text-[#4b5249]">Across the run</p>
                    <div className="flex w-full max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2 pt-1 [scrollbar-width:thin] snap-x snap-mandatory">
                      {lifecyclePreview.timeline.map((row, idx) => (
                        <div
                          key={`tl-${row.day}-${idx}`}
                          className={`flex min-w-[4.25rem] max-w-[5.25rem] shrink-0 snap-start flex-col items-center rounded-xl px-2 py-3 text-center sm:min-w-[4.75rem] ${
                            DISTRESS_STAGE_KEYS.has(row.stage.key)
                              ? "bg-[#e8d4cc]/90"
                              : "bg-[#dce8d6]"
                          }`}
                        >
                          <span className="text-2xl leading-none" aria-hidden>
                            {row.stage.emoji}
                          </span>
                          <span className="mt-2 flex flex-col leading-tight">
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#4b5249]">
                              Day
                            </span>
                            <span className="text-[11px] font-bold tabular-nums text-[#315131]">
                              {row.day}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-2 min-h-[2.25rem] text-[10px] font-medium leading-tight text-[#103a10] sm:text-[11px]">
                            {row.stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {lifecyclePreview.milestones.length > 0 && (
                    <div className="min-w-0 rounded-xl bg-[#dce8d6]/80 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4b5249]">
                        Stage changes
                        <span className="ml-1.5 font-normal normal-case text-[#5c655c]">
                          ({lifecyclePreview.milestones.length})
                        </span>
                      </p>
                      <ul className="mt-2 max-h-[min(40vh,14rem)] space-y-1.5 overflow-y-auto overscroll-y-contain pr-1 text-sm text-[#191c19] sm:max-h-60">
                        {lifecyclePreview.milestones.map((m, mi) => (
                          <li
                            key={`${m.day}-${m.stage.key}-${mi}`}
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-0"
                          >
                            <span className="tabular-nums font-medium text-[#315131]">
                              Day {m.day}
                            </span>
                            <span className="text-[#4b5249]">→</span>
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <span aria-hidden>{m.stage.emoji}</span>
                              <span className="break-words">{m.stage.label}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
