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

const chartOptions = {
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
        maxRotation: 45,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
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

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.45fr_1fr] xl:gap-8">
        <section className="rounded-2xl bg-[#e7f0e3] p-5 sm:p-6 lg:p-7">
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

        <section className="rounded-2xl bg-[#e7f0e3] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#191c19] sm:text-base">Preview results</h2>
          <p className="mt-1 text-xs text-[#4b5249] sm:text-sm">
            Simple scores over time—useful for comparing scenarios, not for real farming decisions.
          </p>
          {!simulationResult ? (
            <p className="mt-4 rounded-xl bg-[#f0f6ed] px-4 py-6 text-sm leading-relaxed text-[#4b5249]">
              Fill in the form and tap <span className="font-medium text-[#103a10]">Show me the chart</span>{" "}
              to see health, stress, and growth lines.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
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
              <div className="h-[min(55vh,22rem)] min-h-[220px] w-full rounded-xl bg-[#f0f6ed] p-2 sm:h-80 sm:min-h-[280px] sm:p-3">
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
