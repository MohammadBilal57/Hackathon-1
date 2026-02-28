import { useState, useEffect } from "react";
import { Brain, Plus, X, AlertTriangle, CheckCircle, Loader, Search, Sparkles, ChevronRight, Activity, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";

const RISK_MAP = {
  low: { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle, label: "Low Risk" },
  medium: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", icon: AlertTriangle, label: "Medium Risk" },
  high: { color: "text-red-500", bg: "bg-red-50", border: "border-red-100", icon: AlertTriangle, label: "High Risk" },
};

export default function SymptomChecker() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [history, setHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await api.get("/patients?limit=100");
        setPatients(data.patients);
      } catch { }
    };
    const fetchLogs = async () => {
      try {
        const { data } = await api.get("/ai/diagnosis-logs?limit=5");
        setLogs(data.logs);
      } catch { }
    };
    fetchPatients();
    fetchLogs();
  }, []);

  const addSymptom = () => {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s)) {
      setSymptoms([...symptoms, s]);
      setSymptomInput("");
    }
  };

  const removeSymptom = (s) => setSymptoms(symptoms.filter((x) => x !== s));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error("Please select a patient trajectory"); return; }
    if (symptoms.length === 0) { toast.error("Add at least one symptom for analysis"); return; }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/ai/symptom-check", {
        patientId: selectedPatient._id,
        symptoms,
        existingHistory: history,
      });
      setResult(data.analysis || data.result);
      if (data.isFallback) {
        toast("Note: AI analysis used fallback logic.", { icon: "⚠️" });
      } else {
        toast.success("AI Synthesis Complete");
      }
      // Refresh logs
      api.get("/ai/diagnosis-logs?limit=5").then(res => setLogs(res.data.logs));
    } catch (err) {
      toast.error(err.response?.data?.message || "AI Engine busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const RiskBadge = result?.riskLevel ? RISK_MAP[result.riskLevel.toLowerCase()] : null;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">AI Diagnostic Workspace</h1>
          <p className="text-slate-500 font-semibold text-sm">Powered by Gemini 1.5 Flash &bull; Augmented Physician Logic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="card">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-xl font-bold text-slate-800">Parameters Input</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Primary Patient Subject</label>
              <div className="relative group mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input className="input-field pl-11" placeholder="Search global registry..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto scrollbar-hide p-1">
                {filteredPatients.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setSelectedPatient(p)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all flex flex-col gap-0.5",
                      selectedPatient?._id === p._id ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "bg-slate-50 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <span className={cn("text-xs font-black truncate", selectedPatient?._id === p._id ? "text-white" : "text-slate-800")}>{p.name}</span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-tighter", selectedPatient?._id === p._id ? "text-blue-100" : "text-slate-400")}>{p.age}y &bull; {p.gender}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Presenting Symptoms</label>
              <div className="flex gap-3">
                <input
                  className="input-field flex-1"
                  placeholder="Define clinical presentation..."
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSymptom())}
                />
                <button type="button" onClick={addSymptom} className="p-3.5 bg-slate-900 shadow-lg shadow-slate-200 text-white rounded-2xl font-black px-6 hover:scale-105 transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {symptoms.length === 0 && <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-2">No symptoms defined yet</p>}
                {symptoms.map((s) => (
                  <span key={s} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2 rounded-2xl border border-blue-100 group animate-in fade-in zoom-in duration-300">
                    {s}
                    <button type="button" onClick={() => removeSymptom(s)} className="text-blue-300 hover:text-blue-600"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Longitudinal History Context (Optional)</label>
              <textarea
                className="input-field resize-none h-[100px]"
                placeholder="e.g. Hypertension, Diabetes, Recent trauma, Family history..."
                value={history}
                onChange={(e) => setHistory(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-5 text-lg">
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : <Brain className="w-6 h-6" />}
              {loading ? "Synthesizing AI Clusters..." : "Execute Clinical Analysis"}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="space-y-8">
          {result ? (
            <div className="card border-0 shadow-2xl shadow-blue-200/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-32 h-32 text-blue-600" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" /> AI Diagnostic Result
                  </h3>
                  <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-tighter">Verified Logic</div>
                </div>

                {RiskBadge && (
                  <div className={cn("rounded-[2rem] p-6 border flex items-center gap-6", RiskBadge.bg, RiskBadge.border)}>
                    <div className={cn("w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center shadow-sm", RiskBadge.color)}>
                      <RiskBadge.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", RiskBadge.color)}>Classification</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">{RiskBadge.label}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{result.urgency || 'Monitor closely for changes.'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Postulated Conditions</p>
                    <div className="space-y-2.5">
                      {result.possibleConditions?.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <p className="text-xs font-black text-slate-700">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Investigative Path</p>
                    <div className="space-y-2.5">
                      {result.suggestedTests?.map((t, i) => (
                        <div key={i} className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                          <p className="text-xs font-black text-emerald-700">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-300">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Clinical Narrative</p>
                  <p className="text-xs font-medium leading-relaxed italic text-slate-300">
                    "{result.summary || 'Clinical summary unavailable.'}"
                  </p>
                </div>

                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">
                  ⚕️ AI outputs are for informational reinforcement. Cross-verify with standard medical protocols.
                </p>
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center py-24 text-center border-dashed group">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                <Brain className="w-10 h-10 text-slate-200 group-hover:text-blue-200 transition-colors" />
              </div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Awaiting Parameter Execution</p>
              <p className="text-slate-300 text-xs mt-2 max-w-[200px] font-medium italic">Clinical insights will be projected here after analysis</p>
            </div>
          )}

          {/* Recent Logs Overlay */}
          {logs.length > 0 && (
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/20">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Workspace Analysis</h3>
              <div className="space-y-4">
                {logs.map((log) => {
                  const Badge = RISK_MAP[log.riskLevel?.toLowerCase()] || RISK_MAP.low;
                  return (
                    <div key={log._id} className="flex items-center gap-4 group cursor-pointer">
                      <div className={cn("w-1.5 h-8 rounded-full transition-all group-hover:h-10", Badge.color.replace('text-', 'bg-'))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{log.patientId?.name || 'Anonymous Subject'}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{log.symptoms?.join(" &bull; ") || 'General check'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
