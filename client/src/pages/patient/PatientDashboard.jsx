import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, Clock, User, Download, ChevronRight, Activity, ShieldCheck, Pill } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { format } from "date-fns";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, presRes] = await Promise.all([
          api.get("/appointments?limit=5"),
          api.get("/prescriptions?limit=5"),
        ]);
        setAppointments(apptRes.data.appointments || []);
        setPrescriptions(presRes.data.prescriptions || []);
      } catch {
        toast.error("Cloud synchronization failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading your personal health vault..." />;

  const upcoming = appointments.find(a => a.status === 'confirmed' || a.status === 'pending');

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Hero */}
      <div className="card bg-[#0F172A] border-0 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/30 rotate-3 group-hover:rotate-0 transition-transform">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Health Hub &bull; {user?.name}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">Patient ID: MP-{(user?._id?.slice(-6) || "000000").toUpperCase()}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{user?.subscriptionPlan} License</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Active Status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Clinical Visits" value={appointments.length} icon={Calendar} color="blue" />
        <StatCard title="Health Records" value={prescriptions.length} icon={FileText} color="green" />
        <StatCard title="Action Required" value={upcoming ? 1 : 0} icon={Clock} color="orange" subtitle="upcoming" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Next Visit Card */}
        <div className="xl:col-span-1">
          <div className="card h-full bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white flex flex-col justify-between">
            <div>
              <h3 className="font-black text-xl mb-2">Next Consultation</h3>
              <p className="text-blue-100 text-sm font-medium opacity-80 mb-8">Stay updated with your scheduled medical visits</p>

              {upcoming ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-lg font-black">{format(new Date(upcoming.date), "MMMM dd")}</p>
                      <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">{upcoming.timeSlot}</p>
                    </div>
                  </div>
                  <div className="p-5 bg-white/10 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Assigned Doctor</p>
                    <p className="font-bold text-lg">Dr. {upcoming.doctorId?.name}</p>
                    <p className="text-xs font-medium text-blue-100 italic opacity-70 mt-1">{upcoming.doctorId?.specialization || 'General Physician'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 opacity-50 font-black uppercase text-xs tracking-widest">No upcoming appointments</div>
              )}
            </div>

            <button className="w-full mt-10 py-4 bg-white text-blue-700 font-black rounded-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all">Manage Bookings</button>
          </div>
        </div>

        {/* Detailed Records */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3"><Pill className="w-6 h-6 text-emerald-500" /> Recent Prescriptions</h3>
              <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">See All</button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">No prescriptions found</div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map(p => (
                  <div key={p._id} className="p-5 rounded-3xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{p.diagnosis || "General Consultation"}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Dr. {p.doctorId?.name} &bull; {format(new Date(p.createdAt), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 transition-all shadow-sm"><Download className="w-4 h-4" /></button>
                      <button className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 transition-all shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
