import { useState, useEffect } from "react";
import api from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Users, Calendar, Activity, DollarSign, AlertTriangle, ShieldCheck, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../utils/cn";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictiveData, setPredictiveData] = useState(null);
  const [loadingPredictive, setLoadingPredictive] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/admin"),
      api.get("/ai/predictive-analytics")
    ])
      .then(([a, p]) => {
        setData(a.data);
        setPredictiveData(p.data);
      })
      .catch(err => console.error("Admin Analytics Error", err))
      .finally(() => {
        setLoading(false);
        setLoadingPredictive(false);
      });
  }, []);

  if (loading) return <LoadingSpinner text="Analyzing global system clusters..." />;

  const monthlyChart = data?.monthlyData?.map((d) => ({
    month: MONTHS[d._id.month - 1],
    appointments: d.count,
  })) || [];

  const revenueChart = monthlyChart.map((m, i) => ({
    ...m,
    revenue: (i + 1) * 45000 + Math.random() * 20000,
  }));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Operations</h1>
          <p className="text-slate-500 font-semibold text-sm">Real-time health of the MediFlow platform.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/20">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Global Status: Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={data?.stats?.totalPatients || 0} icon={Users} color="blue" />
        <StatCard title="Authorized Staff" value={data?.stats?.totalDoctors || 0} icon={Activity} color="green" subtitle="doctors" />
        <StatCard title="Service Usage" value={data?.stats?.monthlyAppointments || 0} icon={Calendar} color="purple" subtitle="monthly" />
        <StatCard title="Simulated Revenue" value={`PKR ${(data?.stats?.simulatedRevenue || 124500).toLocaleString()}`} icon={DollarSign} color="orange" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Predictive AI Analytics */}
        <div className="xl:col-span-2 space-y-8">
          <div className="card bg-[#0F172A] border-0 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Zap className="w-6 h-6 text-blue-400 fill-blue-400" />
                  AI Predictive Engine
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none">Flash 1.5 Active</span>
                </div>
              </div>

              {loadingPredictive ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <LoadingSpinner size="sm" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Synthesizing trends...</p>
                </div>
              ) : predictiveData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Load Forecast</p>
                    <p className="text-2xl font-black text-white">{predictiveData.forecastLoad || 142} <span className="text-xs font-bold text-slate-400">visits</span></p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <TrendingUp className="w-3.5 h-3.5" /> +12.4% vs last week
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Disease Trends</p>
                    <div className="space-y-2.5">
                      {predictiveData.diseaseTrends?.slice(0, 3).map((t, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                          <p className="text-[11px] font-bold text-slate-300 truncate">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Strategic Advice</p>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                      "{predictiveData.recommendations?.[0] || 'Capacity expansion recommended for upcoming week based on respiratory trend.'}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest text-slate-500">AI module synchronization offline</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Appointment Metrics
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyChart}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="appointments" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-500" /> Revenue Growth (Simulated)
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Action Board & Stats */}
        <div className="space-y-8">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3"><Activity className="w-5 h-5 text-indigo-500" /> Global Diagnoses</h3>
            {data?.diagnoses?.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.diagnoses} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4}>
                      {data.diagnoses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4 bg-slate-50/50 p-4 rounded-3xl">
                  {data.diagnoses.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-600 truncate">{d._id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">No clinical data</div>
            )}
          </div>

          <div className="card bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
            <h3 className="font-black text-xl mb-4">Support & Scaling</h3>
            <p className="text-indigo-100 text-xs font-semibold leading-relaxed mb-10">Manage subscription tiers and service limits for clinics across the region.</p>
            <div className="space-y-3">
              <button className="w-full py-3.5 bg-white text-indigo-700 font-black rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all">Staff Management</button>
              <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all">Upgrade All Plans</button>
            </div>
          </div>

          {data?.stats?.riskFlaggedPatients > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-start gap-4">
              <AlertTriangle className="text-red-500 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <p className="text-red-900 text-sm font-black mb-1">Critical Clinical Alerts</p>
                <p className="text-red-700 text-xs font-medium leading-relaxed">
                  {data.stats.riskFlaggedPatients} Patient profiles flagged for critical pattern risks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
