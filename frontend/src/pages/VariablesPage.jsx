import { useCallback, useEffect, useState } from "react";
import { createVariable, getVariables } from "../services/api.js";

export default function VariablesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    weight: "0.1",
    sortOrder: "",
  });

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getVariables();
      setItems(data);
    } catch (e) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createVariable({
        name: form.name.trim(),
        ...(form.key.trim() ? { key: form.key.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.weight !== "" ? { weight: Number(form.weight) } : {}),
        ...(form.sortOrder !== "" ? { sortOrder: Number(form.sortOrder) } : {}),
      });
      setForm({ name: "", key: "", description: "", weight: "0.1", sortOrder: "" });
      await load();
    } catch (e) {
      setError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4b5249]">Living Ledger</p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#191c19]">Simulation Variables</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#4b5249]">
          Define condition axes for your plant simulator (for example water, sunlight). Each
          variable will later be set to low, medium, or high when you run simulations.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl bg-[#e7f0e3] p-7">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4b5249]">
            Add variable
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5249]">
                Display name <span className="text-[#154212]">*</span>
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Water"
                className="mt-2 w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212]"
              />
            </div>
            <div>
              <label htmlFor="key" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5249]">
                Key <span className="text-[#7b837a]">(optional)</span>
              </label>
              <input
                id="key"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="Auto from name if empty, e.g. water"
                className="mt-2 w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 font-mono text-sm text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212]"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5249]">
                Description <span className="text-[#7b837a]">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Notes for editors or future UI"
                className="mt-2 w-full resize-y rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="max-w-xs">
                <label htmlFor="weight" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5249]">
                  Weight
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="0.10"
                  className="mt-2 w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212]"
                />
              </div>
              <div className="max-w-xs">
              <label htmlFor="sortOrder" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5249]">
                Sort order <span className="text-[#7b837a]">(optional)</span>
              </label>
              <input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
                className="mt-2 w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212]"
              />
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-[#dce8d6] px-4 py-3 text-sm text-[#8b2a2a]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-br from-[#154212] to-[#2d5a27] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save variable"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-[#e7f0e3] p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4b5249]">
              Saved variables
            </h2>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-[#154212] hover:bg-[#dce8d6] disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          {loading && items.length === 0 ? (
            <p className="text-sm text-[#4b5249]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl bg-[#f0f6ed] px-4 py-8 text-center text-sm text-[#4b5249]">
              No variables yet. Add water, sunlight, or anything else you want to model.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl bg-[#dce8d6] px-5 py-4"
                >
                  <div>
                    <span className="font-semibold text-[#191c19]">{v.name}</span>
                    <code className="ml-2 rounded-full bg-[#edf5ea] px-2 py-0.5 text-xs text-[#154212]">
                      {v.key}
                    </code>
                    <span className="ml-2 rounded-full bg-[#edf5ea] px-2 py-0.5 text-xs text-[#4b5249]">
                      weight {Number(v.weight ?? 0.1).toFixed(2)}
                    </span>
                  </div>
                  {v.description && (
                    <p className="w-full text-xs text-[#4b5249]">{v.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
