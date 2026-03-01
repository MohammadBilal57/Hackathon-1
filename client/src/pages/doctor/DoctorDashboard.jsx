import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Calendar, FileText, Users, AlertTriangle, ArrowRight, Activity, Brain, Zap } from "lucide-react";
import { cn } from "../../utils/cn";
import { format } from "date-fns";

const STATUS_CHIPS = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  confirmed: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-100"
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/analytics/doctor"), api.get("/appointments?date=" + format(new Date(), "yyyy-MM-dd"))])
      .then(([a, t]) => {
        setAnalytics(a.data);
        setTodayAppts(t.data.appointments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Synchronizing clinical workspace..." />;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "August", "Sep", "Oct", "Nov", "Dec"];
  const chartData = analytics?.monthlyData?.map(d => ({
    month: months[d._id.month - 1],
    count: d.count
  })) || [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Physician Hub</h1>
          <p className="text-slate-500 font-semibold text-sm">Welcome back, Dr. {analytics?.doctorName || "User"}. Efficiency is at 94% today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/doctor/symptom-checker")} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1">
            <Brain className="w-5 h-5" /> AI Diagnostic Assistant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Daily Queue" value={todayAppts.length} icon={Users} color="blue" subtitle="patients" />
        <StatCard title="Monthly Scale" value={analytics?.stats?.monthlyCount || 0} icon={Calendar} color="purple" subtitle="visits" />
        <StatCard title="Rx Issued" value={analytics?.stats?.prescriptionCount || 0} icon={FileText} color="green" />
        <StatCard title="Risk Alert" value={analytics?.stats?.riskFlaggedCount || 0} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> Today's Clinical Schedule
            </h3>
            <button onClick={() => navigate("/doctor/appointments")} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View Calendar</button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayAppts.map(a => (
                <div key={a._id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group flex items-start gap-4 cursor-pointer" onClick={() => navigate(`/doctor/patients/${a.patientId?._id}/timeline`)}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {a.patientId?.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-800 text-sm truncate">{a.patientId?.name}</p>
                      <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider", STATUS_CHIPS[a.status])}>{a.status}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mb-3">{a.timeSlot} · {a.patientId?.age}y / {a.patientId?.gender}</p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 group-hover:gap-2 transition-all">
                      Clinical History <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Breakdown */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-500" /> Patient Volume Trend
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-48 flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-tighter">Insufficient Data</div>}

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Retention</p>
                <p className="text-lg font-black text-slate-800">82.4%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Patient Satisfaction</p>
                <p className="text-lg font-black text-emerald-500">4.9/5</p>
              </div>
            </div>
          </div>

          <div className="card bg-[#0F172A] border-0">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400 fill-blue-400" /> System Note
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
              The nightly AI batch analysis is complete. 3 prescriptions were auto-explained for Pro patients.
            </p>
            <div className="flex gap-3">
              <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all">Manual Check</button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">Review Alerts</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
