import { useEffect, useState } from "react";
import { appointmentAPI, patientAPI, adminAPI } from "../../services/api";
import { CalendarPlus, Search, CheckCircle, XCircle, Calendar } from "lucide-react";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import toast from "react-hot-toast";

const TIME_SLOTS = ["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM"];

const INIT = { patientId: "", doctorId: "", date: "", timeSlot: "", notes: "", symptoms: "" };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchAll = async () => {
    const { data } = await appointmentAPI.getAll({ status: statusFilter, date: dateFilter });
    setAppointments(data.appointments);
    setLoading(false);
  };

  const fetchDoctors = async () => {
    const { data } = await adminAPI.getDoctors();
    setDoctors(data.doctors);
  };

  useEffect(() => { fetchAll(); fetchDoctors(); }, [statusFilter, dateFilter]);

  const searchPatients = async (q) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const { data } = await patientAPI.getAll({ search: q, limit: 5 });
    setPatients(data.patients);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await appointmentAPI.create(form);
      toast.success("Appointment booked!");
      setModal(false);
      setForm(INIT);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to book"); }
  };

  const updateStatus = async (id, status) => {
    try {
      await appointmentAPI.update(id, { status });
      toast.success(`Appointment ${status}`);
      fetchAll();
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-sm text-gray-500">Book and manage appointments</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium">
          <CalendarPlus size={16} /> Book Appointment
        </button>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="">All Status</option>
          {["pending", "confirmed", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
        {(statusFilter || dateFilter) && (
          <button onClick={() => { setStatusFilter(""); setDateFilter(""); }}
            className="text-sm text-blue-600 hover:underline">Clear</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="Book the first appointment." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Patient", "Doctor", "Date & Time", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{a.patientId?.name}</p>
                    <p className="text-xs text-gray-400">{a.patientId?.contact}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">Dr. {a.doctorId?.name}</p>
                    <p className="text-xs text-gray-400">{a.doctorId?.specialization}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{new Date(a.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{a.timeSlot}</p>
                  </td>
                  <td className="px-4 py-3"><Badge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status === "pending" && (
                        <button onClick={() => updateStatus(a._id, "confirmed")}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Confirm">
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {["pending", "confirmed"].includes(a.status) && (
                        <button onClick={() => updateStatus(a._id, "cancelled")}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Cancel">
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Book Appointment" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <input placeholder="Search patient..." value={patientSearch} onChange={(e) => searchPatients(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
            {patients.length > 0 && (
              <div className="border border-gray-200 rounded-xl mt-1 shadow-sm overflow-hidden">
                {patients.map((p) => (
                  <button key={p._id} type="button"
                    onClick={() => { setForm({ ...form, patientId: p._id }); setPatientSearch(p.name); setPatients([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-0">
                    {p.name} • {p.age}y
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Select Doctor</option>
              {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.name} — {d.specialization}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <select required value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Select Time</option>
                {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Reason</label>
            <textarea rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            Book Appointment
          </button>
        </form>
      </Modal>
    </div>
  );
}
