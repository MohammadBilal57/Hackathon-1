export default function Badge({ status }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
    free: "bg-gray-100 text-gray-700",
    pro: "bg-yellow-100 text-yellow-800",
    admin: "bg-purple-100 text-purple-800",
    doctor: "bg-blue-100 text-blue-800",
    receptionist: "bg-teal-100 text-teal-800",
    patient: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
