import { cn } from "../../utils/cn";

export default function StatCard({ title, value, icon: Icon, color = "blue", subtitle }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 ring-blue-500/10",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10",
    purple: "bg-purple-50 text-purple-600 border-purple-100 ring-purple-500/10",
    orange: "bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10",
    red: "bg-red-50 text-red-600 border-red-100 ring-red-500/10",
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center gap-5 hover:scale-[1.02] transition-all group">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ring-4 group-hover:rotate-6",
        colors[color]
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight truncate">{value}</h3>
          {subtitle && <span className="text-xs font-bold text-slate-400">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
