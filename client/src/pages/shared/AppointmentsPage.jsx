import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGES = {
  pending: "badge-warning", confirmed: "badge-info",
  completed: "badge-success", cancelled: "badge-danger"
};

const TIME_SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctorId: "", date: "", timeSlot: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const canCreate = ["admin", "receptionist", "patient"].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    const [apptRes, docRes, patRes] = await Promise.all([
      api.get("/appointments"),
      api.get("/admin/users?role=doctor").catch(() => ({ data: [] })),
      api.get("/patients").catch(() => ({ data: { patients: [] } })),
    ]);
    setAppointments(apptRes.data);
    setDoctors(docRes.data);
    setPatients(patRes.data.patients || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post("/appointments", form);
      toast.success("Appointment booked"); setModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    await api.put("/appointments/" + id + "/status", { status });
    toast.success("Status updated"); fetchData();
  };

  if (loading) return <LoadingSpinner text="Loading appointments..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 text-sm">{appointments.length} total</p>
        </div>
        {canCreate && <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Book Appointment</button>}
      </div>
      {appointments.length === 0 ? <EmptyState title="No appointments yet" /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>{["Patient", "Doctor", "Date & Time", "Status", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.map(a => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{a.patientId?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{a.doctorId?.name || "—"}</p>
                    <p className="text-xs text-slate-400">{a.doctorId?.specialization}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{a.date ? format(new Date(a.date), "MMM dd, yyyy") : "—"}</p>
                    <p className="text-xs text-slate-400">{a.timeSlot}</p>
                  </td>
                  <td className="px-4 py-3"><span className={STATUS_BADGES[a.status]}>{a.status}</span></td>
                  <td className="px-4 py-3">
                    {a.status === "pending" && user?.role !== "patient" && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus(a._id, "confirmed")} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">Confirm</button>
                        <button onClick={() => updateStatus(a._id, "cancelled")} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">Cancel</button>
                      </div>
                    )}
                    {a.status === "confirmed" && user?.role === "doctor" && (
                      <button onClick={() => updateStatus(a._id, "completed")} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Complete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Book Appointment">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient *</label>
            <select className="input-field" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.contact})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Doctor *</label>
            <select className="input-field" required value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.specialization || "General"}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" className="input-field" required value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Slot *</label>
              <select className="input-field" required value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })}>
                <option value="">Select time</option>
                {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reason for visit..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Booking..." : "Book Appointment"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
