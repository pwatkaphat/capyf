import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ session }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-blue-600">Smart IoT</h1>
          <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600">หน้าหลัก</Link>
          <Link to="/add-device" className="text-sm font-medium text-slate-600 hover:text-blue-600">เพิ่มอุปกรณ์</Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-500 hidden md:block">{session?.user?.email}</span>
          <button 
            onClick={handleLogout}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
}
