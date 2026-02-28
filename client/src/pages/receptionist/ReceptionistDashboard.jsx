import { useState, useEffect } from "react";
import { Users, Calendar, Clock, Plus } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, pendingAppts: 0 });
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [patientsRes, apptRes, pendingRes] = await Promise.all([
          api.get("/patients?limit=1"),
          api.get(`/appointments?date=${today}`),
          api.get("/appointments?status=pending&limit=1"),
        ]);
        setStats({
          patients: patientsRes.data.total,
          todayAppts: apptRes.data.total,
          pendingAppts: pendingRes.data.total,
        });
        setTodayAppts(apptRes.data.appointments?.slice(0, 8) || []);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h1>
          <p className="text-gray-500 text-sm">{new Date().toDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/receptionist/patients")} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Patient
          </button>
          <button onClick={() => navigate("/receptionist/appointments")} className="btn-primary flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Patients" value={stats.patients} icon={Users} color="blue" />
        <StatCard title="Today's Appointments" value={stats.todayAppts} icon={Calendar} color="green" />
        <StatCard title="Pending Confirmation" value={stats.pendingAppts} icon={Clock} color="orange" />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : todayAppts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No appointments today</div>
        ) : (
          <div className="space-y-3">
            {todayAppts.map((apt) => (
              <div key={apt._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="min-w-[60px] text-center">
                  <p className="text-sm font-bold text-blue-600">{apt.timeSlot}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{apt.patientId?.name}</p>
                  <p className="text-xs text-gray-400">Dr. {apt.doctorId?.name} • {apt.reason || "General"}</p>
                </div>
                <span className={`badge-${apt.status}`}>{apt.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
