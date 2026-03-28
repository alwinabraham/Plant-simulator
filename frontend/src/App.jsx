import { Link, NavLink, Route, Routes } from "react-router-dom";
import SimulatorPage from "./pages/SimulatorPage.jsx";
import VariablesPage from "./pages/VariablesPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-[#e8f1e4] px-5 py-7 lg:min-h-screen">
        <Link to="/" className="brand text-xl font-bold tracking-tight text-[#103a10]">
          Plant Simulator
        </Link>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4b6b4b]">
          Simulation Engine
        </p>
        <nav className="mt-8 space-y-2 text-sm text-[#315131]">
          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 transition hover:bg-[#d6e8d0] ${
                isActive ? "bg-[#c9e2c0] font-semibold text-[#103a10]" : ""
              }`
            }
          >
            Simulator
          </NavLink>
          <NavLink
            to="/variables"
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 transition hover:bg-[#d6e8d0] ${
                isActive ? "bg-[#c9e2c0] font-semibold text-[#103a10]" : ""
              }`
            }
          >
            Variables
          </NavLink>
        </nav>
      </aside>
      <div>
        <header className="bg-[#edf5ea]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4b6b4b]">
              Rule Engine
            </p>
            <div className="rounded-full bg-[#dbead5] px-3 py-1 text-xs font-semibold text-[#103a10]">
              Engine Live
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-12">
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
