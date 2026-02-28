import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, Calendar, FileText, Brain,
  BarChart2, Settings, LogOut, Stethoscope, UserPlus, ClipboardList
} from "lucide-react";

const navConfig = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/staff", label: "Manage Staff", icon: Users },
    { to: "/admin/patients", label: "Patients", icon: UserPlus },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: Settings },
  ],
  doctor: [
    { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/doctor/appointments", label: "Appointments", icon: Calendar },
    { to: "/doctor/patients", label: "Patients", icon: Users },
    { to: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
    { to: "/doctor/ai-checker", label: "AI Symptom Checker", icon: Brain },
    { to: "/doctor/analytics", label: "My Stats", icon: BarChart2 },
  ],
  receptionist: [
    { to: "/receptionist", label: "Dashboard", icon: LayoutDashboard },
    { to: "/receptionist/patients", label: "Patients", icon: Users },
    { to: "/receptionist/appointments", label: "Appointments", icon: Calendar },
    { to: "/receptionist/schedule", label: "Daily Schedule", icon: ClipboardList },
  ],
  patient: [
    { to: "/patient", label: "My Profile", icon: LayoutDashboard },
    { to: "/patient/appointments", label: "Appointments", icon: Calendar },
    { to: "/patient/prescriptions", label: "Prescriptions", icon: FileText },
    { to: "/patient/timeline", label: "Medical History", icon: ClipboardList },
  ],
};

const roleColors = {
  admin: "from-purple-700 to-purple-900",
  doctor: "from-blue-700 to-blue-900",
  receptionist: "from-teal-700 to-teal-900",
  patient: "from-green-700 to-green-900",
};

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = navConfig[user?.role] || [];
  const gradient = roleColors[user?.role] || "from-blue-700 to-blue-900";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 bg-gradient-to-b ${gradient} text-white flex flex-col min-h-screen fixed top-0 left-0 z-40 shadow-xl`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/20">
        <Stethoscope size={28} className="text-white shrink-0" />
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold leading-tight">ClinicAI</h1>
            <p className="text-xs text-white/70 capitalize">{user?.role} Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split("/").length === 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-white/25 text-white shadow"
                  : "text-white/80 hover:bg-white/15 hover:text-white"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/20 px-3 py-4">
        {!collapsed && (
          <div className="mb-3 px-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
            {user?.subscriptionPlan === "pro" && (
              <span className="inline-block mt-1 text-xs bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5 font-semibold">
                PRO
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition-all text-sm"
        >
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
