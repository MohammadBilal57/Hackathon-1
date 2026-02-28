import { useState, useEffect } from "react";
import { Plus, Calendar, X, Check, Trash2, Loader } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const TIME_SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"];

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function BookAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctorId: "", date: "", timeSlot: "", reason: "", notes: "" });
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append("date", filterDate);
      if (filterStatus !== "all") params.append("status", filterStatus);
      const [apptRes, pRes, dRes] = await Promise.all([
        api.get(`/appointments?${params}`),
        api.get("/patients?limit=200"),
        api.get("/appointments/doctors"),
      ]);
      setAppointments(apptRes.data.appointments);
      setPatients(pRes.data.patients);
      setDoctors(dRes.data.doctors);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterDate, filterStatus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/appointments", form);
      toast.success("Appointment booked!");
      setModalOpen(false);
      setForm({ patientId: "", doctorId: "", date: "", timeSlot: "", reason: "", notes: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book");
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success("Appointment cancelled");
      fetchData();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">Book and manage clinic appointments</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <input type="date" className="input sm:w-48" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <select className="input sm:w-48" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(filterDate || filterStatus !== "all") && (
          <button onClick={() => { setFilterDate(""); setFilterStatus("all"); }} className="text-sm text-blue-600">Clear filters</button>
        )}
      </div>

      {/* Appointments Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Patient", "Doctor", "Date & Time", "Reason", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No appointments found</td></tr>
              ) : appointments.map((apt) => (
                <tr key={apt._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{apt.patientId?.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{apt.doctorId?.name}</p>
                    <p className="text-xs text-gray-400">{apt.doctorId?.specialization}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{new Date(apt.date).toLocaleDateString()}</p>
                    <p className="text-xs text-blue-600 font-medium">{apt.timeSlot}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{apt.reason || "—"}</td>
                  <td className="px-4 py-3"><span className={`badge-${apt.status}`}>{apt.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {apt.status === "pending" && (
                        <button onClick={() => updateStatus(apt._id, "confirmed")} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg" title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {["pending", "confirmed"].includes(apt.status) && (
                        <button onClick={() => cancelAppointment(apt._id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg" title="Cancel">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Book Appointment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Patient*</label>
            <select className="input" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required>
              <option value="">Select patient...</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.name} — {p.age} y/o</option>)}
            </select>
          </div>
          <div>
            <label className="label">Doctor*</label>
            <select className="input" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} required>
              <option value="">Select doctor...</option>
              {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.name} — {d.specialization || "General"}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date*</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="label">Time Slot*</label>
              <select className="input" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} required>
                <option value="">Select time...</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Reason for Visit</label>
            <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Fever, Follow-up" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
