import { useEffect, useState } from "react";
import { patientAPI } from "../../services/api";
import { UserPlus, Search, Eye, Edit2, Users } from "lucide-react";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const INIT = { name: "", age: "", gender: "male", contact: "", email: "", bloodGroup: "", address: "", allergies: "", chronicConditions: "" };

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    const { data } = await patientAPI.getAll({ search });
    setPatients(data.patients);
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      allergies: form.allergies ? form.allergies.split(",").map((s) => s.trim()) : [],
      chronicConditions: form.chronicConditions ? form.chronicConditions.split(",").map((s) => s.trim()) : [],
    };
    try {
      if (editing) {
        await patientAPI.update(editing, payload);
        toast.success("Patient updated!");
      } else {
        await patientAPI.create(payload);
        toast.success("Patient registered!");
      }
      setModal(false);
      setForm(INIT);
      setEditing(null);
      fetchPatients();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const openEdit = (p) => {
    setForm({ ...p, allergies: p.allergies?.join(", ") || "", chronicConditions: p.chronicConditions?.join(", ") || "" });
    setEditing(p._id);
    setModal(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-sm text-gray-500">Register and manage patient records</p>
        </div>
        <button onClick={() => { setForm(INIT); setEditing(null); setModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium">
          <UserPlus size={16} /> Register Patient
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search by name or contact..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : patients.length === 0 ? (
          <EmptyState icon={Users} title="No patients found" description="Register your first patient." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Age", "Gender", "Contact", "Blood Group", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.isRiskFlagged && <span className="w-2 h-2 bg-red-500 rounded-full" title="Risk flagged" />}
                      <span className="font-medium text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.age}</td>
                  <td className="px-4 py-3"><Badge status={p.gender} /></td>
                  <td className="px-4 py-3 text-gray-600">{p.contact}</td>
                  <td className="px-4 py-3 text-gray-600">{p.bloodGroup || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/receptionist/patients/${p._id}`)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => { setModal(false); setEditing(null); setForm(INIT); }}
        title={editing ? "Edit Patient" : "Register New Patient"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Full Name", key: "name", type: "text", span: 2 },
              { label: "Age", key: "age", type: "number", span: 1 },
              { label: "Contact", key: "contact", type: "tel", span: 1 },
              { label: "Email", key: "email", type: "email", span: 2 },
              { label: "Address", key: "address", type: "text", span: 2 },
              { label: "Allergies (comma-separated)", key: "allergies", type: "text", span: 2 },
              { label: "Chronic Conditions (comma-separated)", key: "chronicConditions", type: "text", span: 2 },
            ].map(({ label, key, type, span }) => (
              <div key={key} className={span === 2 ? "col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={["name", "age", "contact"].includes(key)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            {editing ? "Update Patient" : "Register Patient"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
