import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { Plus, Edit2, Trash2, Search } from "lucide-react";

export default function ManageUsers({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, user: null });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", specialization: "", subscriptionPlan: "free" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const { data } = await api.get(`/admin/users?role=${role}&search=${search}`);
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search, role]);

  const openCreate = () => { setForm({ name: "", email: "", password: "", phone: "", specialization: "", subscriptionPlan: "free" }); setModal({ open: true, user: null }); };
  const openEdit = (user) => { setForm({ name: user.name, email: user.email, password: "", phone: user.phone || "", specialization: user.specialization || "", subscriptionPlan: user.subscriptionPlan }); setModal({ open: true, user }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.user) {
        await api.put(`/admin/users/${modal.user._id}`, form);
        toast.success("User updated");
      } else {
        await api.post("/admin/users", { ...form, role });
        toast.success("User created");
      }
      setModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("User deleted");
    fetchUsers();
  };

  const updateSubscription = async (id, plan) => {
    await api.put(`/admin/users/${id}/subscription`, { plan });
    toast.success(`Subscription updated to ${plan}`);
    fetchUsers();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 capitalize">Manage {role}s</h1>
          <p className="text-slate-500 text-sm">{users.length} total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add {role}
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input placeholder={`Search ${role}s...`} className="input-field pl-10"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {users.length === 0 ? <EmptyState title={`No ${role}s found`} /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Name", "Email", "Phone", role === "doctor" && "Specialization", "Plan", "Status", "Actions"]
                  .filter(Boolean).map((h) => <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3 text-slate-500">{user.phone || "—"}</td>
                  {role === "doctor" && <td className="px-4 py-3 text-slate-500">{user.specialization || "—"}</td>}
                  <td className="px-4 py-3">
                    <select value={user.subscriptionPlan} onChange={(e) => updateSubscription(user._id, e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2 py-1">
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.isActive ? "badge-success" : "badge-danger"}>{user.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(user._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, user: null })}
        title={modal.user ? `Edit ${role}` : `Add ${role}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          {!modal.user && (
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" className="input-field" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {role === "doctor" && (
              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input className="input-field" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, user: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
