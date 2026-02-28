import { useState, useEffect } from "react";
import { Calendar, Check, X, Clock, Search } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const statusColors = { pending: "badge-pending", confirmed: "badge-confirmed", completed: "badge-completed", cancelled: "badge-cancelled" };

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (date) params.append("date", date);
      const { data } = await api.get(`/appointments?${params}`);
      setAppointments(data.appointments);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [filter, date]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and update appointment statuses</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <select className="input sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="input sm:w-48" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && <button onClick={() => setDate("")} className="text-sm text-gray-500 hover:text-gray-700">Clear date</button>}
      </div>

      {/* Appointments Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Patient", "Date & Time", "Reason", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No appointments found</td></tr>
              ) : appointments.map((apt) => (
                <tr key={apt._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{apt.patientId?.name}</p>
                      <p className="text-xs text-gray-400">{apt.patientId?.age} y/o • {apt.patientId?.gender}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{new Date(apt.date).toLocaleDateString()}</p>
                    <p className="text-xs text-blue-600 font-medium">{apt.timeSlot}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{apt.reason || "—"}</td>
                  <td className="px-4 py-3"><span className={statusColors[apt.status]}>{apt.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {apt.status === "pending" && (
                        <button onClick={() => updateStatus(apt._id, "confirmed")} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg" title="Confirm">
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {apt.status === "confirmed" && (
                        <button onClick={() => updateStatus(apt._id, "completed")} className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg" title="Complete">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {["pending", "confirmed"].includes(apt.status) && (
                        <button onClick={() => updateStatus(apt._id, "cancelled")} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/doctor/patients/${apt.patientId?._id}/timeline`)}
                        className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs px-2"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
