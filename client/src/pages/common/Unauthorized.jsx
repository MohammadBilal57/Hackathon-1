import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-6 mx-auto">
          Go Back
        </button>
      </div>
    </div>
  );
}
