import { useState, useEffect } from "react";
import { Plus, Download, FileText, X, Loader, Eye, ArrowRight, User, Pill, ClipboardList, Send, Activity, ShieldCheck, Search } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";
import { cn } from "../../utils/cn";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const generatePDF = (prescription, user) => {
  const doc = new jsPDF();
  const { patient, doctor } = { patient: prescription.patientId, doctor: prescription.doctorId };

  // Premium Header Decor
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("MediFlow OS", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("E-Prescription & Clinical Summary Portfolio", 20, 32);
  doc.setTextColor(59, 130, 246); // blue-500
  doc.setFont("helvetica", "bold");
  doc.text(`Dr. ${doctor?.name || user.name} | ${doctor?.specialization || "Physician Specialist"}`, 20, 39);

  doc.setTextColor(15, 23, 42);

  // Patient Info Cluster
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical Subject Data", 20, 60);

  doc.setDrawColor(241, 245, 249);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 65, 170, 30, 4, 4, "FD");

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("NAME", 28, 75);
  doc.text("DATE", 130, 75);
  doc.text("BIOMETRICS", 28, 87);
  doc.text("REF ID", 130, 87);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`${patient?.name?.toUpperCase()}`, 28, 80);
  doc.text(`${format(new Date(prescription.createdAt), "PPP")}`, 130, 80);
  doc.text(`${patient?.age}Y / ${patient?.gender?.toUpperCase()} / ${patient?.bloodGroup || "O+"}`, 28, 92);
  doc.text(`#${(prescription._id?.slice(-8) || "00000000").toUpperCase()}`, 130, 92);

  // Clinical Diagnosis
  if (prescription.diagnosis) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Clinical Diagnosis", 20, 110);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const splitDiagnosis = doc.splitTextToSize(prescription.diagnosis, 170);
    doc.text(splitDiagnosis, 20, 117);
  }

  // Medicines Matrix
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Pharmacological Matrix", 20, 135);

  autoTable(doc, {
    startY: 140,
    head: [["Compound", "Dosage", "Schedule", "Cycle", "Directives"]],
    body: prescription.medicines.map((m) => [m.name, m.dosage, m.frequency, m.duration, m.instructions || "Ref: clinical"]),
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 5, font: "helvetica" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  // Footer & Sign-off
  const finalY = doc.lastAutoTable.finalY + 15;
  if (prescription.instructions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Strategic Healthcare Note", 20, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitInstr = doc.splitTextToSize(prescription.instructions, 170);
    doc.text(splitInstr, 20, finalY + 7);
  }

  const footerY = 280;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, footerY - 5, 190, footerY - 5);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text("Digitally Certified by MediFlow Clinical Engine • 2026 Platform Stack", 20, footerY);
  doc.text(`Doc Auth: DR_${(doctor?.name || user.name).toUpperCase().replace(" ", "_")}`, 150, footerY);

  doc.save(`Rx_${patient?.name?.replace(" ", "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
};

const emptyMed = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [form, setForm] = useState({ patientId: "", diagnosis: "", instructions: "", followUpDate: "", document: null, medicines: [{ ...emptyMed }] });

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/prescriptions");
      setPrescriptions(data.prescriptions || []);
    } catch {
      toast.error("Records synchronization timeout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    api.get("/patients?limit=200").then(({ data }) => setPatients(data.patients)).catch(() => { });
  }, []);

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { ...emptyMed }] });
  const removeMedicine = (i) => setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) });
  const updateMed = (i, field, value) => {
    const meds = [...form.medicines];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medicines: meds });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patientId) { toast.error("Primary subject must be selected"); return; }
    if (form.medicines.some((m) => !m.name || !m.dosage)) { toast.error("Medicine matrix integrity failed"); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("patientId", form.patientId);
      formData.append("diagnosis", form.diagnosis);
      formData.append("instructions", form.instructions);
      formData.append("followUpDate", form.followUpDate);
      formData.append("medicines", JSON.stringify(form.medicines));
      if (form.document) formData.append("document", form.document);

      await api.post("/prescriptions", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Rx Deployment Successful");
      setCreateOpen(false);
      setForm({ patientId: "", diagnosis: "", instructions: "", followUpDate: "", document: null, medicines: [{ ...emptyMed }] });
      fetchPrescriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cloud deployment error");
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">E-Prescription Portfolio</h1>
          <p className="text-slate-500 font-semibold text-sm">Create and calibrate pharmacological records.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]">
          <Plus className="w-5 h-5" /> New Tactical Rx
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-0 shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-slate-100">
              <tr>
                {["Subject Patient", "Clinical Observation", "Dosage Cycle", "Registry Date", "Actions"].map((h) => (
                  <th key={h} className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20"><LoadingSpinner size="sm" /></td></tr>
              ) : prescriptions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-300 font-black uppercase text-[11px] tracking-widest">No clinical records found</td></tr>
              ) : prescriptions.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50 group transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {p.patientId?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{p.patientId?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.patientId?.age}y &bull; {p.patientId?.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-600 truncate max-w-[200px]">{p.diagnosis || "Ref: General Observation"}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-black text-slate-700">{p.medicines?.length} Compounds</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-400">{format(new Date(p.createdAt), "MMM dd, yyyy")}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewOpen(p)} className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 shadow-sm transition-all"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => generatePDF(p, user)} className="p-3 bg-white text-slate-400 hover:text-emerald-600 rounded-2xl border border-slate-100 shadow-sm transition-all" title="Archive as PDF"><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Creation Flow */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-all" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white h-full w-full max-w-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500">
            <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Prescription Master</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manual Calibrated Entry</p>
              </div>
              <button onClick={() => setCreateOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide pb-24">
              <div>
                <label className="label">Primary Subject</label>
                <div className="relative mb-3">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="input-field pl-11" placeholder="Filter patient registry..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {filteredPatients.slice(0, 10).map(p => (
                    <button key={p._id} type="button" onClick={() => setForm({ ...form, patientId: p._id })} className={cn(
                      "px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-tight whitespace-nowrap border transition-all",
                      form.patientId === p._id ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-500 border-slate-100 border-transparent hover:border-slate-300"
                    )}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Observational Conclusion</label>
                <input className="input-field" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Diagnosis or clinical hypothesis..." />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Pharmacological Cluster</label>
                  <button type="button" onClick={addMedicine} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm"><Plus className="w-3 h-3" /> Add Compound</button>
                </div>
                <div className="space-y-4">
                  {form.medicines.map((med, i) => (
                    <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 relative group/med animate-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1"><input className="input-field py-2.5 text-xs" placeholder="Medicine Name*" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)} required /></div>
                        <div className="col-span-1"><input className="input-field py-2.5 text-xs" placeholder="Dosage* (eg. 5mg)" value={med.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} required /></div>
                        <div className="col-span-1 text-xs"><input className="input-field py-2.5" placeholder="Frequency* (eg. 1-0-1)" value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} required /></div>
                        <div className="col-span-1 text-xs"><input className="input-field py-2.5" placeholder="Duration* (eg. 5 days)" value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} required /></div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <input className="input-field py-2 text-[11px]" placeholder="Specific compounding instructions..." value={med.instructions} onChange={(e) => updateMed(i, "instructions", e.target.value)} />
                        {form.medicines.length > 1 && (
                          <button type="button" onClick={() => removeMedicine(i)} className="w-10 flex-shrink-0 flex items-center justify-center bg-red-50 text-red-500 rounded-xl border border-red-100 opacity-0 group-hover/med:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label">Follow-up Re-entry</label>
                  <input type="date" className="input-field" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">Attachments (Lab/Img)</label>
                  <label className="flex flex-col items-center justify-center w-full h-12 px-4 transition bg-white border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:border-blue-400 focus:outline-none">
                    <span className="flex items-center space-x-2">
                      <CloudinaryIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{form.document ? form.document.name.slice(0, 15) + '...' : 'Upload Cloudinary'}</span>
                    </span>
                    <input type="file" className="hidden" onChange={(e) => setForm({ ...form, document: e.target.files[0] })} />
                  </label>
                </div>
              </div>

              <div>
                <label className="label">General Strategic Instructions</label>
                <textarea className="input-field resize-none h-[80px]" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Lifestyle changes, hydration, urgent alerts..." />
              </div>
            </form>

            <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-white/90 backdrop-blur-md border-t border-slate-100 flex gap-4">
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">Abort Entry</button>
              <button type="button" onClick={handleCreate} disabled={saving} className="btn-primary flex-[2]">
                {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {saving ? "Deploying..." : "Finalize & Issue Rx"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern View Panel */}
      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-sm" onClick={() => setViewOpen(null)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">Clinical Portfolio</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Rx #{viewOpen._id?.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setViewOpen(null)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide pb-24">
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-2xl border border-blue-100 shadow-sm shadow-blue-200/50">
                    {viewOpen.patientId?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-2xl font-black text-slate-800 tracking-tight">{viewOpen.patientId?.name}</h5>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><User className="w-3.5 h-3.5 text-blue-500" /> {viewOpen.patientId?.age}Y</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Activity className="w-3.5 h-3.5 text-emerald-500" /> {viewOpen.patientId?.gender}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> {format(new Date(viewOpen.createdAt), "MMM dd, yyyy")}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-l-4 border-blue-600 pl-3">Clinical Evaluation</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100">{viewOpen.diagnosis || "Manual clinical evaluation recorded."}</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-l-4 border-emerald-500 pl-3">Compound Registry</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewOpen.medicines?.map((m, i) => (
                    <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/20">
                      <p className="font-black text-emerald-600 text-sm mb-1">{m.name}</p>
                      <p className="text-xs font-bold text-slate-800 mb-0.5">{m.dosage} &bull; {m.frequency}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{m.duration}</p>
                      {m.instructions && <p className="mt-3 text-[10px] font-medium text-slate-500 italic border-t border-slate-50 pt-2">"{m.instructions}"</p>}
                    </div>
                  ))}
                </div>
              </div>

              {viewOpen.aiExplanation && (
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <Brain className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-16 -mt-16" />
                  <h5 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> AI Clinical Narration
                  </h5>
                  <p className="text-xs leading-relaxed font-medium text-slate-300 italic whitespace-pre-wrap relative z-10">{viewOpen.aiExplanation}</p>
                </div>
              )}
            </div>

            <div className="p-10 pt-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex gap-4">
              <button onClick={() => setViewOpen(null)} className="btn-secondary flex-1">Close Viewer</button>
              <button onClick={() => generatePDF(viewOpen, user)} className="btn-primary flex-[2]">
                <Download className="w-5 h-5" /> Export Portfolio Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloudinaryIcon({ className }) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M19.1 13H15v1.2c0 2.1-1.7 3.8-3.8 3.8h-1.4c-2.1 0-3.8-1.7-3.8-3.8V13H5.9c-.5 0-.9-.4-.9-.9V9.9c0-.5.4-.9.9-.9h3.1V7.8C9 5.7 10.7 4 12.8 4h1.4c2.1 0 3.8 1.7 3.8 3.8V9h4.1c.5 0 .9.4.9.9v2.1c0 .6-.4 1-.9 1zm-7 2h1.4c.7 0 1.2-.5 1.2-1.2V11h-3.8v2.8c0 .7.5 1.2 1.2 1.2z" />
    </svg>
  )
}
