import { useEffect, useState } from "react";
import { prescriptionAPI, patientAPI, appointmentAPI } from "../../services/api";
import { FileText, Plus, Download, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { generatePrescriptionPDF } from "../../utils/pdfGenerator";
import toast from "react-hot-toast";

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [form, setForm] = useState({ patientId: "", diagnosis: "", instructions: "", medicines: [{ ...EMPTY_MED }], followUpDate: "" });

  const fetch = async () => {
    const { data } = await prescriptionAPI.getAll();
    setPrescriptions(data.prescriptions);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const searchPatients = async (q) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const { data } = await patientAPI.getAll({ search: q, limit: 5 });
    setPatients(data.patients);
  };

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { ...EMPTY_MED }] });
  const removeMedicine = (i) => setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) });
  const updateMedicine = (i, key, val) => {
    const meds = [...form.medicines];
    meds[i][key] = val;
    setForm({ ...form, medicines: meds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await prescriptionAPI.create(form);
      toast.success("Prescription created!");
      setModal(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDownload = (rx) => {
    generatePrescriptionPDF(rx);
    toast.success("PDF downloaded!");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
          <p className="text-sm text-gray-500">Manage and generate prescriptions</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> New Prescription
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : prescriptions.length === 0 ? (
          <EmptyState icon={FileText} title="No prescriptions yet" description="Create your first prescription." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Patient", "Diagnosis", "Medicines", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{rx.patientId?.name}</p>
                    <p className="text-xs text-gray-400">{rx.patientId?.age}y • {rx.patientId?.gender}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{rx.diagnosis || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rx.medicines.slice(0, 2).map((m, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{m.name}</span>
                      ))}
                      {rx.medicines.length > 2 && <span className="text-xs text-gray-400">+{rx.medicines.length - 2} more</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDownload(rx)}
                      className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                      <Download size={13} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Prescription" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient search */}
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
                    {p.name} • {p.age}y {p.gender}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Medicines</label>
              <button type="button" onClick={addMedicine}
                className="text-xs text-blue-600 hover:underline font-medium">+ Add Medicine</button>
            </div>
            {form.medicines.map((m, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 mb-2 p-3 bg-gray-50 rounded-xl">
                {[
                  { placeholder: "Medicine name", key: "name" },
                  { placeholder: "Dosage (e.g. 500mg)", key: "dosage" },
                  { placeholder: "Frequency", key: "frequency" },
                  { placeholder: "Duration", key: "duration" },
                ].map(({ placeholder, key }) => (
                  <input key={key} required placeholder={placeholder} value={m[key]}
                    onChange={(e) => updateMedicine(i, key, e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                ))}
                <button type="button" onClick={() => removeMedicine(i)}
                  className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions / Notes</label>
            <textarea rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            Create Prescription
          </button>
        </form>
      </Modal>
    </div>
  );
}
