import { Bell, Menu, Search, Command } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function Header() {
    const { user } = useAuth();
    const location = useLocation();

    let pageTitle = "Dashboard Overview";
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts.length > 1) {
        pageTitle = pathParts[pathParts.length - 1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20 w-full">
            <div className="flex items-center gap-8 flex-1">
                <button className="lg:hidden text-slate-500 hover:text-blue-600 transition-colors">
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden md:flex items-center gap-2 text-slate-400">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{pageTitle}</h2>
                    <span className="text-slate-200">/</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">MediFlow OS</span>
                </div>

                <div className="hidden lg:flex items-center flex-1 max-w-md ml-8">
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 w-4 h-4 transition-colors" />
                        <input
                            placeholder="Universal search (Ctrl + K)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
                            <Command className="w-3 h-3" /> <span className="text-[10px] font-bold">K</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <button className="relative w-11 h-11 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-4 ring-white"></span>
                    </button>
                </div>

                <div className="w-[1px] h-8 bg-slate-100"></div>

                <div className="flex items-center gap-4 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-slate-800 leading-none mb-1">{user?.name}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{user?.subscriptionPlan} License</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm ring-1 ring-blue-50 shadow-sm border-2 border-white cursor-pointer hover:rotate-6 transition-transform">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}
