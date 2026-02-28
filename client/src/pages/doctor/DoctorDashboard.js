import { useEffect, useState } from "react";
import { analyticsAPI } from "../../services/api";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { Calendar, FileText, CheckCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDoctorStats()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your stats..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, Dr. {user?.name?.split(" ")[0]}!</h1>
        <p className="text-gray-500 text-sm">{user?.specialization || "General Physician"} • {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Today's Appointments" value={data.stats.todayCount} icon={Clock} color="blue" />
            <StatCard title="This Month" value={data.stats.monthCount} icon={Calendar} color="purple" />
            <StatCard title="Prescriptions" value={data.stats.prescriptionCount} icon={FileText} color="green" sub="this month" />
            <StatCard title="Completed" value={data.stats.completedCount} icon={CheckCircle} color="teal" sub="all time" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Appointments — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {user?.subscriptionPlan === "free" && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">Upgrade to Pro</p>
            <p className="text-sm text-white/90">Unlock AI Symptom Checker, unlimited patients & advanced analytics</p>
          </div>
          <button className="bg-white text-orange-500 font-bold px-5 py-2 rounded-xl hover:shadow-lg transition-all text-sm">
            Upgrade — $49/mo
          </button>
        </div>
      )}
    </div>
  );
}
