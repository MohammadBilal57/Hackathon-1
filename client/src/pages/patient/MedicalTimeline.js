import { useEffect, useState } from "react";
import { patientAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import { Calendar, FileText, Brain } from "lucide-react";

const icons = { appointment: Calendar, prescription: FileText, diagnosis: Brain };
const colors = {
  appointment: "bg-blue-100 text-blue-600",
  prescription: "bg-green-100 text-green-600",
  diagnosis: "bg-purple-100 text-purple-600",
};

export default function MedicalTimeline() {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Need patient's linked patient profile — for demo, using userId
    // In production, store patientProfileId in user doc
    patientAPI.getAll({ search: user.name, limit: 1 }).then(({ data }) => {
      if (data.patients[0]) {
        patientAPI.getTimeline(data.patients[0]._id).then(({ data }) => {
          setTimeline(data.timeline);
        });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your medical history..." />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Medical Timeline</h1>
        <p className="text-sm text-gray-500">Your complete health history in chronological order</p>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No medical history found</div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
          {timeline.map((item, i) => {
            const Icon = icons[item.type];
            const colorClass = colors[item.type];
            return (
              <div key={i} className="relative mb-6">
                <div className={`absolute -left-5 w-8 h-8 rounded-full flex items-center justify-center ${colorClass} shadow-sm`}>
                  <Icon size={14} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-gray-400">{item.type}</span>
                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  {item.type === "appointment" && (
                    <div>
                      <p className="font-medium text-gray-800">Dr. {item.data.doctorId?.name}</p>
                      <p className="text-sm text-gray-500">{item.data.timeSlot} • <Badge status={item.data.status} /></p>
                      {item.data.symptoms && <p className="text-xs text-gray-400 mt-1">Reason: {item.data.symptoms}</p>}
                    </div>
                  )}
                  {item.type === "prescription" && (
                    <div>
                      <p className="font-medium text-gray-800">Prescription by Dr. {item.data.doctorId?.name}</p>
                      {item.data.diagnosis && <p className="text-sm text-gray-500">Diagnosis: {item.data.diagnosis}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.data.medicines?.map((m, j) => (
                          <span key={j} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{m.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.type === "diagnosis" && (
                    <div>
                      <p className="font-medium text-gray-800">AI Diagnosis Assessment</p>
                      <p className="text-sm text-gray-500">Risk Level: <Badge status={item.data.riskLevel} /></p>
                      <p className="text-xs text-gray-400 mt-1">{item.data.symptoms}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
