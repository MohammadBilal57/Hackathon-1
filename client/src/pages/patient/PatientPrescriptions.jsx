import { useState, useEffect } from "react";
import { Download, FileText, Globe, Eye, X, Loader } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";

const generatePDF = (prescription) => {
  const doc = new jsPDF();
  const patient = prescription.patientId;
  const doctor = prescription.doctorId;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ClinicAI", 15, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dr. ${doctor?.name} | ${doctor?.specialization || "General Physician"}`, 15, 30);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${patient?.name}`, 15, 63);
  doc.text(`Age/Gender: ${patient?.age} / ${patient?.gender}`, 15, 70);
  doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 140, 63);

  if (prescription.diagnosis) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Diagnosis", 15, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(prescription.diagnosis, 15, 93);
  }

  autoTable(doc, {
    startY: 105,
    head: [["Medicine", "Dosage", "Frequency", "Duration"]],
    body: prescription.medicines.map((m) => [m.name, m.dosage, m.frequency, m.duration]),
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
  });

  doc.save(`prescription_${new Date(prescription.createdAt).toLocaleDateString()}.pdf`);
};

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLang, setAiLang] = useState("english");

  useEffect(() => {
    api.get("/prescriptions")
      .then(({ data }) => setPrescriptions(data.prescriptions))
      .catch(() => toast.error("Failed to load prescriptions"))
      .finally(() => setLoading(false));
  }, []);

  const generateAIExplanation = async (prescriptionId, lang) => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`/prescriptions/${prescriptionId}/ai-explain`, { language: lang });
      if (data.aiFailed) {
        toast("AI explanation unavailable. Please contact your doctor.", { icon: "⚠️" });
      } else {
        toast.success("AI explanation generated!");
        setPrescriptions((prev) =>
          prev.map((p) =>
            p._id === prescriptionId
              ? { ...p, aiExplanation: lang === "english" ? data.explanation : p.aiExplanation, aiExplanationUrdu: lang === "urdu" ? data.explanation : p.aiExplanationUrdu }
              : p
          )
        );
        if (viewModal?._id === prescriptionId) {
          setViewModal((prev) => ({
            ...prev,
            aiExplanation: lang === "english" ? data.explanation : prev.aiExplanation,
            aiExplanationUrdu: lang === "urdu" ? data.explanation : prev.aiExplanationUrdu,
          }));
        }
      }
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        toast.error("AI explanations require Pro subscription");
      } else {
        toast.error("Failed to generate explanation");
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-sm text-gray-500 mt-1">View, understand, and download your prescriptions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No prescriptions yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((p) => (
            <div key={p._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{p.diagnosis || "Prescription"}</p>
                  <p className="text-sm text-gray-500">Dr. {p.doctorId?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewModal(p)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => generatePDF(p)} className="p-2 hover:bg-green-50 text-green-600 rounded-lg"><Download className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {p.medicines?.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span className="font-medium">{m.name}</span>
                    <span className="text-gray-400">— {m.dosage} • {m.frequency}</span>
                  </div>
                ))}
                {p.medicines?.length > 3 && <p className="text-xs text-gray-400">+{p.medicines.length - 3} more</p>}
              </div>

              {p.aiExplanation ? (
                <div className="p-3 bg-blue-50 rounded-lg mt-2">
                  <p className="text-xs font-semibold text-blue-600 mb-1">🤖 AI Explanation Available</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{p.aiExplanation}</p>
                </div>
              ) : user.subscriptionPlan === "pro" && (
                <button
                  onClick={() => generateAIExplanation(p._id, "english")}
                  disabled={aiLoading}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Get AI Explanation
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-lg">Prescription Details</h3>
              <button onClick={() => setViewModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Doctor:</span> <span className="font-medium">Dr. {viewModal.doctorId?.name}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(viewModal.createdAt).toLocaleDateString()}</span></div>
                {viewModal.diagnosis && <div className="col-span-2"><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{viewModal.diagnosis}</span></div>}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Medicines</h4>
                {viewModal.medicines?.map((m, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2">
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.dosage} • {m.frequency} for {m.duration}</p>
                    {m.instructions && <p className="text-xs text-gray-400 mt-0.5">{m.instructions}</p>}
                  </div>
                ))}
              </div>

              {viewModal.instructions && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Doctor's Instructions</p>
                  <p className="text-sm text-gray-700">{viewModal.instructions}</p>
                </div>
              )}

              {/* AI Explanation Section */}
              {user.subscriptionPlan === "pro" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <select className="input text-sm" value={aiLang} onChange={(e) => setAiLang(e.target.value)}>
                      <option value="english">English</option>
                      <option value="urdu">Urdu (Roman)</option>
                    </select>
                    <button
                      onClick={() => generateAIExplanation(viewModal._id, aiLang)}
                      disabled={aiLoading}
                      className="btn-primary text-sm py-2 flex items-center gap-1.5 flex-shrink-0"
                    >
                      {aiLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                      {aiLoading ? "..." : "Explain"}
                    </button>
                  </div>
                  {(viewModal.aiExplanation || viewModal.aiExplanationUrdu) && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-600 mb-2">🤖 AI Explanation</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {aiLang === "urdu" ? viewModal.aiExplanationUrdu : viewModal.aiExplanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {viewModal.documentUrl && (
                <div className="pt-2">
                  <a href={viewModal.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                    <FileText className="w-4 h-4" /> View Uploaded Document
                  </a>
                </div>
              )}

              <button onClick={() => generatePDF(viewModal)} className="btn-primary w-full flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
