import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { format } from "date-fns";
import { Calendar, Stethoscope, Pill, ArrowLeft, User, ChevronRight, Activity, AlertCircle } from "lucide-react";

export default function PatientTimeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/patients/" + id),
      api.get("/patients/" + id + "/timeline")
    ]).then(([p, t]) => {
      setPatient(p.data.patient);
      setTimeline(t.data.timeline);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner text="Fetching clinical history..." />;
  if (!patient) return <EmptyState title="Patient not found" />;

  const renderItem = (item) => {
    switch (item.type) {
      case "appointment":
        return (
          <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="w-0.5 h-full bg-slate-200 mt-2 min-h-[40px]" />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-1 mb-8 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800">Appointment Scheduled</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.data.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {item.data.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">With <span className="font-bold text-slate-800">{item.data.doctorId?.name}</span> ({item.data.doctorId?.specialization || 'General'})</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(item.data.date), "PPP")}</span>
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {item.data.timeSlot}</span>
              </div>
              {item.data.notes && <p className="mt-3 text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg border-l-2 border-slate-200">"{item.data.notes}"</p>}
            </div>
          </div>
        );
      case "diagnosis":
        return (
          <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="w-0.5 h-full bg-slate-200 mt-2 min-h-[40px]" />
            </div>
            <div className="bg-indigo-50/30 rounded-2xl p-5 border border-indigo-100 shadow-sm flex-1 mb-8 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-800">Clinical Diagnosis</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.data.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    item.data.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                  {item.data.riskLevel} Risk
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Symptoms Reported</p>
                  <p className="text-sm font-medium text-slate-700">{item.data.symptoms}</p>
                </div>
                {item.data.possibleConditions?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">AI Assessment</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.data.possibleConditions.map((c, i) => (
                        <span key={i} className="text-[11px] bg-white text-slate-600 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm font-semibold">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-100 flex justify-between items-center bg-transparent">
                <span className="text-xs text-indigo-500 font-bold">Assessed by {item.data.doctorId?.name}</span>
                <span className="text-[10px] font-semibold text-slate-400">{format(new Date(item.date), "MMM dd, yyyy · p")}</span>
              </div>
            </div>
          </div>
        );
      case "prescription":
        return (
          <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
                <Pill className="w-5 h-5" />
              </div>
              <div className="w-0.5 h-full bg-slate-200 mt-2 min-h-[40px]" />
            </div>
            <div className="bg-emerald-50/30 rounded-2xl p-5 border border-emerald-100 shadow-sm flex-1 mb-8 hover:shadow-md transition-shadow">
              <h4 className="font-bold text-slate-800 mb-3">Prescription Issued</h4>
              <div className="space-y-2">
                {item.data.medicines?.map((m, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.dosage} · {m.frequency}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">{m.duration}</span>
                  </div>
                ))}
              </div>
              {item.data.instructions && <p className="mt-4 text-xs text-slate-600 bg-white/50 p-2.5 rounded-lg border border-dashed border-emerald-200 leading-relaxed font-medium"><span className="text-emerald-700 font-bold">Note:</span> {item.data.instructions}</p>}
              <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-between items-center">
                <span className="text-xs text-emerald-500 font-bold underline cursor-pointer hover:text-emerald-700">Download PDF</span>
                <span className="text-[10px] font-semibold text-slate-400">{format(new Date(item.date), "MMM dd, yyyy")}</span>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header Profile Card */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mb-10 mt-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />

        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg ring-1 ring-blue-100">
            {patient.name[0]}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-3">
              {patient.name}
              {patient.isRiskFlagged && <span className="p-1 px-3 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1 font-bold animate-pulse"><AlertCircle className="w-3 h-3" /> Risk Flagged</span>}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {patient.age}y / {patient.gender}</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {patient.bloodGroup || "—"}</span>
              <span className="flex items-center gap-1.5"><ChevronRight className="w-4 h-4" /> {patient.contact}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 hover:bg-white hover:text-slate-800 transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Medical History Timeline
          </h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{timeline.length} Clinical Events</span>
        </div>

        {timeline.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <EmptyState title="No clinical history yet" description="History will appear here after examinations and prescriptions are recorded." />
          </div>
        ) : (
          <div className="space-y-2">
            {timeline.map((item, idx) => (
              <div key={idx}>{renderItem(item)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
