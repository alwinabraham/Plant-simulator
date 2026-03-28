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
      setError(e.message ?? "We couldn’t load your list. Check your connection and try again.");
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
      setError(e.message ?? "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 text-left sm:space-y-10 lg:space-y-12">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4b5249] sm:text-xs">
          Setup
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#191c19] sm:mt-2 sm:text-4xl lg:text-5xl">
          Conditions you measure
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5249] sm:mt-4 sm:text-base">
          Add things like water, light, or soil—anything you want to turn into Low, Normal, or High on
          the preview screen. Higher &quot;importance&quot; makes that condition count more in the
          preview.
        </p>
      </header>

      <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-[1.55fr_1fr] lg:gap-8 xl:gap-10">
        <section className="rounded-2xl bg-[#e7f0e3] p-5 sm:p-6 lg:p-7">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#191c19] sm:text-base">Add a condition</h2>
            <p className="text-xs leading-snug text-[#4b5249] sm:text-sm">
              Only the name is required. Everything else helps organize and tune the preview.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-0">
              <label htmlFor="name" className="block text-sm font-medium leading-tight text-[#191c19]">
                Name <span className="text-[#154212]">*</span>
              </label>
              <p className="mt-1 min-h-[2.5rem] text-xs leading-snug text-[#5c655c] sm:min-h-0">
                What people see in the app (e.g. Water)
              </p>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Water"
                className="mt-2 min-h-[48px] w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-base text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212] sm:text-sm"
              />
            </div>
            <div className="space-y-0">
              <label htmlFor="key" className="block text-sm font-medium leading-tight text-[#191c19]">
                Short code <span className="font-normal text-[#5c655c]">(optional)</span>
              </label>
              <p className="mt-1 min-h-[2.5rem] text-xs leading-snug text-[#5c655c] sm:min-h-0">
                We fill this in from the name if you leave it blank.
              </p>
              <input
                id="key"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="water"
                className="mt-2 min-h-[48px] w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 font-mono text-sm text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212]"
              />
            </div>
            <div className="space-y-0">
              <label htmlFor="description" className="block text-sm font-medium leading-tight text-[#191c19]">
                Notes <span className="font-normal text-[#5c655c]">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional reminder for your team"
                className="mt-2 w-full resize-y rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-base text-[#191c19] placeholder:text-[#7b837a] outline-none transition focus:border-[#154212] sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              <div className="flex min-w-0 flex-col">
                <label htmlFor="weight" className="block text-sm font-medium leading-tight text-[#191c19]">
                  Importance in preview
                </label>
                <p className="mt-1 min-h-[3rem] text-xs leading-snug text-[#5c655c] sm:min-h-[2.75rem]">
                  Bigger number = this condition matters more. Default 0.1 is fine for most.
                </p>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="0.10"
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-base text-[#191c19] outline-none transition focus:border-[#154212] sm:text-sm"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <label htmlFor="sortOrder" className="block text-sm font-medium leading-tight text-[#191c19]">
                  List order <span className="font-normal text-[#5c655c]">(optional)</span>
                </label>
                <p className="mt-1 min-h-[3rem] text-xs leading-snug text-[#5c655c] sm:min-h-[2.75rem]">
                  Lower numbers appear first. Leave blank for 0.
                </p>
                <input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  placeholder="0"
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-[#a8bea1]/30 bg-[#f0f6ed] px-4 py-3 text-base text-[#191c19] outline-none transition focus:border-[#154212] sm:text-sm"
                />
              </div>
            </div>
            {error && (
              <p
                className="rounded-xl bg-[#dce8d6] px-4 py-3 text-left text-sm text-[#8b2a2a]"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="flex justify-stretch pt-1 sm:justify-start">
              <button
                type="submit"
                disabled={saving}
                className="min-h-[48px] w-full rounded-xl bg-gradient-to-br from-[#154212] to-[#2d5a27] px-5 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[12rem] sm:px-6 sm:text-sm"
              >
                {saving ? "Saving…" : "Add condition"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-[#e7f0e3] p-5 sm:p-6 lg:p-7">
          <div className="mb-4 flex flex-row items-center justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-sm font-semibold leading-tight text-[#191c19] sm:text-base">
              Your list
            </h2>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#a8bea1]/40 bg-[#f0f6ed] px-4 text-sm font-semibold text-[#154212] transition hover:bg-[#dce8d6] disabled:opacity-50 sm:h-10 sm:border-0 sm:bg-transparent sm:px-3 sm:underline-offset-2 hover:sm:underline"
            >
              {loading ? "Refreshing…" : "Refresh list"}
            </button>
          </div>
          {loading && items.length === 0 ? (
            <p className="text-left text-sm text-[#4b5249]">Loading your conditions…</p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl bg-[#f0f6ed] px-4 py-8 text-left text-sm leading-relaxed text-[#4b5249] sm:px-5">
              Nothing here yet. Add a few conditions (like water and sunlight), then open{" "}
              <span className="font-medium text-[#103a10]">Preview growth</span> to try them out.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 sm:gap-4">
              {items.map((v) => (
                <li
                  key={v.id}
                  className="rounded-2xl bg-[#dce8d6] px-4 py-4 text-left sm:px-5"
                >
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-base font-semibold leading-snug text-[#191c19]">{v.name}</span>
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-[#edf5ea] px-2.5 py-1 font-mono text-xs leading-none text-[#154212]">
                        {v.key}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#edf5ea] px-2.5 py-1 text-xs leading-none text-[#4b5249]">
                        importance {Number(v.weight ?? 0.1).toFixed(2)}
                      </span>
                    </div>
                    {v.description && (
                      <p className="w-full border-t border-[#c9dcc0]/60 pt-2 text-sm leading-relaxed text-[#4b5249]">
                        {v.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
