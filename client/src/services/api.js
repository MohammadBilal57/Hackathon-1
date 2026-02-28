import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach access token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${API.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  logout: () => API.post("/auth/logout"),
  getMe: () => API.get("/auth/me"),
  updateProfile: (data) => API.patch("/auth/profile", data),
};

// Patients
export const patientAPI = {
  getAll: (params) => API.get("/patients", { params }),
  getOne: (id) => API.get(`/patients/${id}`),
  create: (data) => API.post("/patients", data),
  update: (id, data) => API.put(`/patients/${id}`, data),
  delete: (id) => API.delete(`/patients/${id}`),
  getTimeline: (id) => API.get(`/patients/${id}/timeline`),
};

// Appointments
export const appointmentAPI = {
  getAll: (params) => API.get("/appointments", { params }),
  getOne: (id) => API.get(`/appointments/${id}`),
  create: (data) => API.post("/appointments", data),
  update: (id, data) => API.put(`/appointments/${id}`, data),
  cancel: (id) => API.delete(`/appointments/${id}`),
  getSchedule: (params) => API.get("/appointments/schedule", { params }),
};

// Prescriptions
export const prescriptionAPI = {
  getAll: (params) => API.get("/prescriptions", { params }),
  getOne: (id) => API.get(`/prescriptions/${id}`),
  create: (data) => API.post("/prescriptions", data),
  generateExplanation: (id, data) => API.post(`/prescriptions/${id}/explanation`, data),
};

// AI
export const aiAPI = {
  analyzeSymptoms: (data) => API.post("/ai/symptom-checker", data),
  runRiskFlag: (patientId) => API.post(`/ai/risk-flag/${patientId}`),
  getDiagnosisLogs: (params) => API.get("/ai/diagnosis-logs", { params }),
};

// Admin
export const adminAPI = {
  getStaff: (params) => API.get("/admin/staff", { params }),
  createStaff: (data) => API.post("/admin/staff", data),
  updateStaff: (id, data) => API.put(`/admin/staff/${id}`, data),
  deleteStaff: (id) => API.delete(`/admin/staff/${id}`),
  updateSubscription: (data) => API.post("/admin/subscription", data),
  getDoctors: () => API.get("/admin/doctors"),
};

// Analytics
export const analyticsAPI = {
  getAdminStats: () => API.get("/analytics/admin"),
  getDoctorStats: () => API.get("/analytics/doctor"),
};

export default API;
