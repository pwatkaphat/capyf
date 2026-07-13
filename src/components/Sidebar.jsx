import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, PlusCircle, Settings, Sprout } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', label: 'หน้าสวน', shortLabel: 'หน้าสวน', icon: LayoutDashboard },
  { path: '/add-device', label: 'เพิ่มอุปกรณ์', shortLabel: 'อุปกรณ์', icon: PlusCircle },
  { path: '/sensor-config', label: 'ตั้งค่าการดูแล', shortLabel: 'ตั้งค่า', icon: Settings },
];

export default function Sidebar({ session }) {
  const location = useLocation();
  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <>
      <aside className="desktop-sidebar">
        <Link to="/dashboard" className="sidebar-brand" aria-label="CapyF หน้าสวน">
          <span className="brand-mark"><Sprout size={22} strokeWidth={2.7} /></span>
          <span><strong>CapyF</strong><small>เพื่อนคู่ใจชาวสวน</small></span>
        </Link>
        <div className="sidebar-farm-card">
          <span className="sidebar-mascot">🦫</span>
          <div><strong>สวัสดีชาวสวน!</strong><small>วันนี้มาดูแลสวนกัน</small></div>
        </div>
        <nav className="sidebar-nav" aria-label="เมนูหลัก">
          <span className="sidebar-section-label">เมนูดูแลสวน</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={active ? 'sidebar-link is-active' : 'sidebar-link'}><Icon size={20} strokeWidth={2.35} /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-account"><small>บัญชีที่ใช้งาน</small><strong title={session?.user?.email}>{session?.user?.email}</strong></div>
          <button type="button" onClick={handleLogout} className="sidebar-logout"><LogOut size={18} /> ออกจากระบบ</button>
        </div>
      </aside>

      <header className="mobile-header">
        <Link to="/dashboard" className="mobile-brand"><span className="brand-mark"><Sprout size={19} /></span><strong>CapyF</strong></Link>
        <span className="mobile-online"><i /> ออนไลน์</span>
      </header>
      <nav className="mobile-nav" aria-label="เมนูมือถือ">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return <Link key={item.path} to={item.path} className={active ? 'mobile-nav-link is-active' : 'mobile-nav-link'}><Icon size={21} strokeWidth={2.4} /><span>{item.shortLabel}</span></Link>;
        })}
        <button type="button" onClick={handleLogout} className="mobile-nav-link"><LogOut size={21} /><span>ออก</span></button>
      </nav>
    </>
  );
}
