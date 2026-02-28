import { Zap } from "lucide-react";

export default function UpgradeBanner({ message = "Upgrade to Pro to access this feature" }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Zap className="w-6 h-6 text-purple-600" />
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">Pro Feature</h3>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
        Upgrade to Pro
      </button>
    </div>
  );
}
