import { useState } from "react";
import { aiAPI, patientAPI } from "../../services/api";
import { Brain, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import toast from "react-hot-toast";

export default function AISymptomChecker() {
  const [form, setForm] = useState({ patientId: "", symptoms: "", age: "", gender: "male", history: "" });
  const [patients, setPatients] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");

  const handlePatientSearch = async (query) => {
    setSearchPatient(query);
    if (query.length < 2) { setPatients([]); return; }
    const { data } = await patientAPI.getAll({ search: query, limit: 5 });
    setPatients(data.patients);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) { toast.error("Please select a patient"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.analyzeSymptoms(form);
      setResult(data);
      if (data.isFallback) toast("AI unavailable — showing fallback response", { icon: "⚠️" });
      else toast.success("AI analysis complete!");
    } catch (err) {
      if (err.response?.status === 403) toast.error("AI features require Pro subscription");
      else toast.error("Analysis failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl"><Brain size={24} className="text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Symptom Checker</h1>
          <p className="text-gray-500 text-sm">Powered by Google Gemini — always validate with clinical judgment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <input
                placeholder="Search patient by name..."
                value={searchPatient}
                onChange={(e) => handlePatientSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
              {patients.length > 0 && (
                <div className="border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm">
                  {patients.map((p) => (
                    <button key={p._id} type="button"
                      onClick={() => { setForm({ ...form, patientId: p._id, age: p.age, gender: p.gender }); setSearchPatient(p.name); setPatients([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-gray-400 ml-2">{p.age}y • {p.gender}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms *</label>
              <textarea rows={3} required value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                placeholder="e.g. fever for 3 days, sore throat, fatigue..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <textarea rows={2} value={form.history}
                onChange={(e) => setForm({ ...form, history: e.target.value })}
                placeholder="Any existing conditions, medications, allergies..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              <Brain size={16} />
              {loading ? "Analyzing..." : "Analyze Symptoms"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {loading && <LoadingSpinner text="AI is analyzing symptoms..." />}

          {result && !loading && (
            <div className="space-y-4">
              {result.isFallback && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-yellow-700 text-sm">
                  <AlertCircle size={16} /> AI service unavailable — showing fallback response
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Analysis Result</h3>
                  <Badge status={result.analysis.riskLevel} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Possible Conditions</p>
                  <div className="space-y-1">
                    {result.analysis.possibleConditions?.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={14} className="text-blue-500 shrink-0" /> {c}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Suggested Tests</p>
                  <div className="space-y-1">
                    {result.analysis.suggestedTests?.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <FlaskConical size={14} className="text-green-500 shrink-0" /> {t}
                      </div>
                    ))}
                  </div>
                </div>

                {result.analysis.summary && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">Clinical Summary</p>
                    <p>{result.analysis.summary}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">{result.analysis.disclaimer}</p>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <Brain size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 text-sm">Fill in symptoms and click Analyze to get AI-powered insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
