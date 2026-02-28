import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import Subscription from "./pages/admin/Subscription";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import SymptomChecker from "./pages/doctor/SymptomChecker";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";

// Receptionist Pages
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import ManagePatients from "./pages/receptionist/ManagePatients";
import BookAppointment from "./pages/receptionist/BookAppointment";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";

// Common Pages
import PatientTimeline from "./pages/common/PatientTimeline";
import NotFound from "./pages/common/NotFound";
import Unauthorized from "./pages/common/Unauthorized";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = { admin: "/admin", doctor: "/doctor", receptionist: "/receptionist", patient: "/patient" };
  return <Navigate to={routes[user.role] || "/login"} replace />;
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: "10px", fontSize: "14px" } }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="patients/:id/timeline" element={<PatientTimeline />} />
        </Route>

        {/* Doctor Routes */}
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={["doctor"]}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="symptom-checker" element={<SymptomChecker />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="patients/:id/timeline" element={<PatientTimeline />} />
        </Route>

        {/* Receptionist Routes */}
        <Route path="/receptionist" element={<ProtectedRoute allowedRoles={["receptionist"]}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ReceptionistDashboard />} />
          <Route path="patients" element={<ManagePatients />} />
          <Route path="appointments" element={<BookAppointment />} />
          <Route path="patients/:id/timeline" element={<PatientTimeline />} />
        </Route>

        {/* Patient Routes */}
        <Route path="/patient" element={<ProtectedRoute allowedRoles={["patient"]}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<PatientDashboard />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
