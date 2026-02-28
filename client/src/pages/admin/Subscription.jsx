import { useState, useEffect } from "react";
import { Crown, Zap, Search } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function Subscription() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/admin/users");
        setUsers(data.users);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const togglePlan = async (userId, currentPlan) => {
    const newPlan = currentPlan === "pro" ? "free" : "pro";
    setUpdating(userId);
    try {
      await api.put(`/admin/subscription/${userId}`, { plan: newPlan });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, subscriptionPlan: newPlan } : u));
      toast.success(`Subscription updated to ${newPlan.toUpperCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const proCount = users.filter((u) => u.subscriptionPlan === "pro").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user subscription plans</p>
      </div>

      {/* Plan info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-gray-400" />
            <h3 className="font-bold text-gray-700">Free Plan</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Up to 20 patients</li>
            <li>✓ Basic appointments</li>
            <li>✓ Basic analytics</li>
            <li className="text-red-400">✗ No AI features</li>
            <li className="text-red-400">✗ No PDF downloads</li>
          </ul>
          <p className="mt-3 text-sm font-semibold text-gray-500">{users.length - proCount} users</p>
        </div>

        <div className="card border-2 border-yellow-400 bg-yellow-50">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6 text-yellow-600" />
            <h3 className="font-bold text-yellow-700">Pro Plan</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">$49<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Unlimited patients</li>
            <li>✓ All AI features</li>
            <li>✓ Full analytics</li>
            <li>✓ PDF prescription download</li>
            <li>✓ Priority support</li>
          </ul>
          <p className="mt-3 text-sm font-semibold text-yellow-700">{proCount} users • ${proCount * 49}/mo revenue</p>
        </div>
      </div>

      {/* User list */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["User", "Role", "Current Plan", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : filtered.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-gray-600">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                      user.subscriptionPlan === "pro" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {user.subscriptionPlan === "pro" && <Crown className="w-3 h-3" />}
                      {user.subscriptionPlan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePlan(user._id, user.subscriptionPlan)}
                      disabled={updating === user._id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        user.subscriptionPlan === "pro"
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      }`}
                    >
                      {updating === user._id ? "..." : user.subscriptionPlan === "pro" ? "Downgrade to Free" : "Upgrade to Pro"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
