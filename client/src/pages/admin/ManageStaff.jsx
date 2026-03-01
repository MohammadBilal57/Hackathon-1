import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { UserPlus, Search, Trash2, Edit, Users } from "lucide-react";
import toast from "react-hot-toast";

const INIT = { name: "", email: "", password: "", role: "doctor", specialization: "", phone: "" };

export default function ManageStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchStaff = async () => {
    try {
      const { data } = await adminAPI.getStaff({ search, role: roleFilter });
      setStaff(data.staff);
    } catch { toast.error("Failed to load staff"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, [search, roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createStaff(form);
      toast.success("Staff account created!");
      setModal(false);
      setForm(INIT);
      fetchStaff();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this account?")) return;
    try {
      await adminAPI.deleteStaff(id);
      toast.success("Account deactivated");
      fetchStaff();
    } catch { toast.error("Failed to deactivate"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Staff</h1>
          <p className="text-gray-500 text-sm">Doctors and receptionists</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
          <UserPlus size={16} /> Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">All Roles</option>
          <option value="doctor">Doctors</option>
          <option value="receptionist">Receptionists</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : staff.length === 0 ? (
          <EmptyState icon={Users} title="No staff found" description="Add staff accounts to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Role", "Specialization", "Plan", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3"><Badge status={s.role} /></td>
                  <td className="px-4 py-3 text-gray-500">{s.specialization || "-"}</td>
                  <td className="px-4 py-3"><Badge status={s.subscriptionPlan} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeactivate(s._id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Staff">
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { label: "Full Name", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" },
            { label: "Phone", key: "phone", type: "tel" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input required={key !== "phone"} type={type} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === "doctor" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input type="text" value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g. Cardiologist"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          )}
          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            Create Account
          </button>
        </form>
      </Modal>
    </div>
  );
}
