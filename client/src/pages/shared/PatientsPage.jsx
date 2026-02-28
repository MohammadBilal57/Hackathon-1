import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { Plus, Search, Eye, Edit2, AlertTriangle } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, patient: null });
  const [form, setForm] = useState({ name: "", age: "", gender: "male", contact: "", email: "", bloodGroup: "", address: "", medicalHistory: "", allergies: "" });
  const [saving, setSaving] = useState(false);
  const canCreate = ["admin", "receptionist"].includes(user?.role);

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await api.get("/patients?search=" + search);
    setPatients(data.patients);
    setLoading(false);
  };
  useEffect(() => { fetchPatients(); }, [search]);

  const openCreate = () => { setForm({ name: "", age: "", gender: "male", contact: "", email: "", bloodGroup: "", address: "", medicalHistory: "", allergies: "" }); setModal({ open: true, patient: null }); };
  const openEdit = (p) => { setForm({ ...p, allergies: p.allergies?.join(", ") || "" }); setModal({ open: true, patient: p }); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, age: Number(form.age), allergies: form.allergies ? form.allergies.split(",").map(s => s.trim()) : [] };
      if (modal.patient) { await api.put("/patients/" + modal.patient._id, payload); toast.success("Patient updated"); }
      else { await api.post("/patients", payload); toast.success("Patient registered"); }
      setModal({ open: false, patient: null }); fetchPatients();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Loading patients..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-slate-500 text-sm">{patients.length} registered</p>
        </div>
        {canCreate && <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Register Patient</button>}
      </div>
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input placeholder="Search by name or contact..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {patients.length === 0 ? <EmptyState title="No patients found" /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>{["Patient", "Age/Gender", "Contact", "Blood Group", "Risk", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map(p => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{p.name}</p><p className="text-xs text-slate-400">{p.email}</p></td>
                  <td className="px-4 py-3 text-slate-600">{p.age}y / {p.gender}</td>
                  <td className="px-4 py-3 text-slate-600">{p.contact}</td>
                  <td className="px-4 py-3"><span className="badge-info">{p.bloodGroup || "—"}</span></td>
                  <td className="px-4 py-3">{p.isRiskFlagged && <span className="flex items-center gap-1 text-red-600 text-xs"><AlertTriangle className="w-3 h-3" />Flagged</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => navigate("/patients/" + p._id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                      {canCreate && <button onClick={() => openEdit(p)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Edit2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, patient: null })} title={modal.patient ? "Edit Patient" : "Register Patient"} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Full Name *</label><input className="input-field" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Age *</label><input type="number" className="input-field" required value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Contact *</label><input className="input-field" required value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Blood Group</label>
              <select className="input-field" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                <option value="">Select</option>{BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
              </select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Address</label><input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Medical History</label><textarea className="input-field" rows={2} value={form.medicalHistory} onChange={e => setForm({ ...form, medicalHistory: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Allergies (comma-separated)</label><input className="input-field" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, patient: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Save Patient"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
