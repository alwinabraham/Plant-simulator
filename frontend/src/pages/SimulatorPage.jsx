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

const LEVELS = ["low", "medium", "high"];

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function SimulatorPage() {
  const [variables, setVariables] = useState([]);
  const [days, setDays] = useState(7);
  const [selectedLevels, setSelectedLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function loadVariables() {
      setLoading(true);
      setError(null);
      try {
        const data = await getVariables();
        setVariables(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message ?? "Failed to load variables");
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
    setError(null);
    setRunning(true);
    try {
      const payload = {
        days: Number(days) || 1,
        variables: effectiveSelection,
      };
      const result = await runSimulation(payload);
      setSimulationResult(result);
    } catch (e) {
      setError(e.message ?? "Failed to run simulation");
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
          label: "Health",
          data: history.map((h) => h.health),
          borderColor: "#2d5a27",
          backgroundColor: "rgba(45, 90, 39, 0.2)",
          tension: 0.3,
        },
        {
          label: "Stress",
          data: history.map((h) => h.stress),
          borderColor: "#b42318",
          backgroundColor: "rgba(180, 35, 24, 0.15)",
          tension: 0.3,
        },
        {
          label: "Growth",
          data: history.map((h) => h.growth),
          borderColor: "#1f4f7a",
          backgroundColor: "rgba(31, 79, 122, 0.15)",
          tension: 0.3,
        },
      ],
    };
  }, [simulationResult]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4b5249]">Simulator</p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#191c19]">Run Plant Simulation</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#4b5249]">
          Select a level for each variable. If a variable is left unselected, it is automatically
          sent as <span className="font-semibold text-[#154212]">medium</span>.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="rounded-2xl bg-[#e7f0e3] p-7">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4b5249]">
            Simulation input
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div className="max-w-sm">
              <label
                htmlFor="days"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5249]"
              >
                Days needed
              </label>
              <input
                id="days"
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-[#191c19] outline-none transition focus:border-[#154212]"
              />
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-[#4b5249]">Loading variables…</p>
              ) : error ? (
                <p className="rounded-xl bg-[#dce8d6] px-4 py-3 text-sm text-[#8b2a2a]">{error}</p>
              ) : variables.length === 0 ? (
                <p className="rounded-xl bg-[#f0f6ed] px-4 py-6 text-sm text-[#4b5249]">
                  No variables found. Add variables first from the Variables page.
                </p>
              ) : (
                variables.map((variable) => (
                  <div
                    key={variable.id}
                    className="grid gap-3 rounded-xl bg-[#dce8d6] px-4 py-3 sm:grid-cols-[1fr_180px]"
                  >
                    <div>
                      <p className="font-semibold text-[#191c19]">{variable.name}</p>
                      <p className="text-xs text-[#4b5249]">
                        {variable.key} • weight {Number(variable.weight ?? 0.1).toFixed(2)}
                      </p>
                    </div>
                    <select
                      value={selectedLevels[variable.key] || ""}
                      onChange={(e) => handleLevelChange(variable.key, e.target.value)}
                      className="rounded-lg border border-[#a8bea1]/40 bg-[#edf5ea] px-3 py-2 text-sm text-[#191c19] outline-none focus:border-[#154212]"
                    >
                      <option value="">Default (medium)</option>
                      {LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>

            <button
              type="submit"
              disabled={running}
              className="rounded-xl bg-gradient-to-br from-[#154212] to-[#2d5a27] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {running ? "Running..." : "Run simulation"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-[#e7f0e3] p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4b5249]">
            Simulation results
          </h2>
          {!simulationResult ? (
            <p className="mt-4 rounded-xl bg-[#f0f6ed] px-4 py-6 text-sm text-[#4b5249]">
              Run the simulation to generate health, stress, and growth chart data.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f0f6ed] px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#4b5249]">Final health</p>
                  <p className="mt-1 text-xl font-semibold text-[#2d5a27]">
                    {simulationResult.summary.finalHealth}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f0f6ed] px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#4b5249]">Final stress</p>
                  <p className="mt-1 text-xl font-semibold text-[#b42318]">
                    {simulationResult.summary.finalStress}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f0f6ed] px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#4b5249]">Final growth</p>
                  <p className="mt-1 text-xl font-semibold text-[#1f4f7a]">
                    {simulationResult.summary.finalGrowth}
                  </p>
                </div>
              </div>
              <div className="h-[320px] rounded-xl bg-[#f0f6ed] p-3">
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
