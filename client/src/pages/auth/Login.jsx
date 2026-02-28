import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const roleRedirects = { admin: "/admin", doctor: "/doctor", receptionist: "/receptionist", patient: "/patient" };

  useEffect(() => {
    if (user) navigate(roleRedirects[user.role] || "/");
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(formData.email, formData.password);
      if (success) toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, pass) => setFormData({ email, password: pass });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-700">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] relative">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white fill-white/20" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to MediFlow</h1>
              <p className="text-slate-500 text-sm mt-2">Sign in to manage your clinic workflow</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Quick Login Demo</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Admin", email: "admin@mediflow.com", pass: "Admin@123" },
                  { label: "Doctor", email: "doctor@mediflow.com", pass: "Doctor@123" },
                  { label: "Reception", email: "reception@mediflow.com", pass: "Recept@123" },
                  { label: "Patient", email: "patient@mediflow.com", pass: "Patient@123" },
                ].map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => quickLogin(demo.email, demo.pass)}
                    className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-blue-500 transition-colors">{demo.label}</span>
                    <span className="text-[11px] font-medium text-slate-600 truncate w-full text-center">{demo.email.split("@")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center mt-8 text-sm text-slate-500">
              Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Sign up for free</Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          &copy; 2026 MediFlow AI &bull; Smart Clinic Management
        </p>
      </div>
    </div>
  );
}
