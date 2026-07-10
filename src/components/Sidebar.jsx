import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, PlusCircle, LogOut, Sprout, Settings } from 'lucide-react';

export default function Sidebar({ session }) {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/add-device', label: 'Add Device', icon: PlusCircle },
    { path: '/sensor-config', label: 'Sensor Config', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/70 backdrop-blur-xl border-r border-emerald-100/50 shadow-[4px_0_32px_rgba(16,185,129,0.05)] hidden md:flex flex-col">
      <div className="p-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
          <Sprout size={20} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold gradient-text">Robocloud</h1>
          <span className="text-[10px] font-bold text-emerald-600 tracking-wider">Smart Farm</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-semibold ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} strokeWidth={2.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="px-4 py-3 mb-2 rounded-xl bg-white border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Logged in as</p>
          <p className="text-sm font-semibold text-slate-700 truncate" title={session?.user?.email}>
            {session?.user?.email}
          </p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-semibold shadow-sm"
        >
          <LogOut size={18} strokeWidth={2.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
