import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, Calendar, ClipboardList, Activity,
  Settings, LogOut, Heart, ShieldCheck, Zap
} from "lucide-react";
import { cn } from "../../utils/cn";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleMenus = {
    admin: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/users", label: "Staff Management", icon: Users },
      { to: "/admin/subscription", label: "Plan Toggles", icon: Zap },
    ],
    doctor: [
      { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
      { to: "/doctor/appointments", label: "Daily Schedule", icon: Calendar },
      { to: "/doctor/symptom-checker", label: "AI Diagnostic", icon: Activity },
      { to: "/doctor/prescriptions", label: "Prescriptions", icon: ClipboardList },
    ],
    receptionist: [
      { to: "/receptionist", label: "Overview", icon: LayoutDashboard },
      { to: "/receptionist/patients", label: "Patients", icon: Users },
      { to: "/receptionist/appointments", label: "Booking", icon: Calendar },
    ],
    patient: [
      { to: "/patient", label: "Health Hub", icon: LayoutDashboard },
      { to: "/patient/prescriptions", label: "My Records", icon: ClipboardList },
    ],
  };

  const menu = roleMenus[user?.role] || [];
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-72 h-screen bg-[#0F172A] flex flex-col fixed left-0 top-0 z-30 shadow-2xl transition-all duration-300">
      {/* Brand */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-11 h-11 flex items-center justify-center bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Heart className="text-white w-6 h-6 fill-white/20" />
          </div>
          <div>
            <p className="font-black text-white text-xl tracking-tight">MediFlow</p>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded ml-[-1px]">AI Enabled</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-8 space-y-1.5 overflow-y-auto scrollbar-hide">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/" + user?.role}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all group",
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Account Info */}
      <div className="p-6">
        <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black border-2 border-white/10 shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>

          {user?.subscriptionPlan === 'pro' && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enterprise Pro</span>
            </div>
          )}

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
