import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import SimulatorPage from "./pages/SimulatorPage.jsx";
import VariablesPage from "./pages/VariablesPage.jsx";

export default function App() {
  const { pathname } = useLocation();
  const previewActive = pathname === "/" || pathname === "/simulator";

  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[min(18rem,100%)_1fr]">
      <aside className="border-b border-[#c9dcc0] bg-[#e8f1e4] px-4 py-4 sm:px-5 sm:py-5 lg:border-b-0 lg:min-h-screen lg:py-7">
        <div className="lg:block">
          <Link
            to="/"
            className="brand block text-lg font-bold tracking-tight text-[#103a10] sm:text-xl"
          >
            Plant Simulator
          </Link>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#4b6b4b] sm:text-xs">
            Track conditions, preview growth
          </p>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] lg:mt-8 lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0">
          <Link
            to="/"
            className={`shrink-0 rounded-xl px-4 py-3 text-center text-sm font-medium transition sm:min-h-[44px] sm:py-3 lg:block lg:w-full lg:py-2.5 lg:text-left ${
              previewActive
                ? "bg-[#c9e2c0] font-semibold text-[#103a10]"
                : "text-[#315131] hover:bg-[#d6e8d0]"
            }`}
          >
            Preview growth
          </Link>
          <NavLink
            to="/variables"
            className={({ isActive }) =>
              `shrink-0 rounded-xl px-4 py-3 text-center text-sm font-medium transition sm:min-h-[44px] sm:py-3 lg:block lg:w-full lg:py-2.5 lg:text-left ${
                isActive
                  ? "bg-[#c9e2c0] font-semibold text-[#103a10]"
                  : "text-[#315131] hover:bg-[#d6e8d0]"
              }`
            }
          >
            Conditions
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-[#dce8d6] bg-[#edf5ea]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4b6b4b] sm:text-xs">
              Today&apos;s workspace
            </p>
            <div className="w-fit rounded-full bg-[#dbead5] px-3 py-1.5 text-xs font-semibold text-[#103a10]">
              Ready to use
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <Routes>
            <Route path="/" element={<SimulatorPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/variables" element={<VariablesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
