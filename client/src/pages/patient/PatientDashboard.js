import { useEffect, useState } from "react";
import { appointmentAPI, prescriptionAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { generatePrescriptionPDF } from "../../utils/pdfGenerator";
import { Calendar, FileText, Download, User, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentAPI.getAll({ limit: 5 }),
      prescriptionAPI.getAll({ limit: 5 }),
    ]).then(([aRes, pRes]) => {
      setAppointments(aRes.data.appointments);
      setPrescriptions(pRes.data.prescriptions);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your health records..." />;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.name}</h1>
            <p className="text-blue-100 text-sm">{user?.email}</p>
            {user?.subscriptionPlan === "pro" && (
              <span className="inline-block mt-1 text-xs bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5 font-semibold">PRO Member</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Recent Appointments</h2>
          </div>
          {appointments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No appointments yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {appointments.map((a) => (
                <div key={a._id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Dr. {a.doctorId?.name}</p>
                      <p className="text-xs text-gray-400">{a.doctorId?.specialization}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(a.date).toLocaleDateString()} • {a.timeSlot}</p>
                    </div>
                    <Badge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText size={16} className="text-green-600" />
            <h2 className="font-semibold text-gray-800">My Prescriptions</h2>
          </div>
          {prescriptions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No prescriptions yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {prescriptions.map((rx) => (
                <div key={rx._id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Dr. {rx.doctorId?.name}</p>
                    <p className="text-xs text-gray-400">{rx.diagnosis}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(rx.createdAt).toLocaleDateString()}</p>
                  </div>
                  {user?.subscriptionPlan === "pro" ? (
                    <button onClick={() => { generatePrescriptionPDF(rx); toast.success("PDF downloaded!"); }}
                      className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                      <Download size={13} /> PDF
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <AlertCircle size={12} /> Pro only
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
