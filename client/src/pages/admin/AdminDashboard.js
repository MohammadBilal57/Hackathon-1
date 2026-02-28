import { useEffect, useState } from "react";
import { analyticsAPI } from "../../services/api";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Users, UserCheck, Calendar, TrendingUp, AlertTriangle, Crown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getAdminStats()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (!data) return <div className="text-red-500">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Patients" value={data.stats.totalPatients} icon={Users} color="blue" />
        <StatCard title="Total Doctors" value={data.stats.totalDoctors} icon={UserCheck} color="green" />
        <StatCard title="Appointments" value={data.stats.totalAppointments} icon={Calendar} color="purple" />
        <StatCard title="Risk Flagged" value={data.stats.flaggedPatients} icon={AlertTriangle} color="red" />
        <StatCard title="Pro Users" value={data.stats.proUsers} icon={Crown} color="orange" />
        <StatCard title="Est. Revenue" value={`$${data.stats.proUsers * 49}`} icon={TrendingUp} color="teal" sub="monthly" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Appointments</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlyAppointments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Diagnoses</h3>
          {data.diagnosisStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.diagnosisStats} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                  {data.diagnosisStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">No diagnosis data yet</div>
          )}
        </div>
      </div>

      {/* Simulated Revenue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Simulated Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.simulatedRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => `$${val}`} />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
