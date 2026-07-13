import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Cpu, MapPin, Plus, Radio, Trash2, Wifi } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './AddDevice.css';

const defaultZones = ['แปลง A · แปลงหลัก', 'โรงเรือน 1', 'สวนผลไม้'];
const getZones = () => {
  const saved = localStorage.getItem('capyf_zones') || localStorage.getItem('smartfarm_zones');
  try { return saved ? JSON.parse(saved) : defaultZones; } catch { return defaultZones; }
};

export default function AddDevice({ session }) {
  const [zones, setZones] = useState(getZones);
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNewZone, setShowNewZone] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    supabase.from('user_devices').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).then(({ data }) => setDevices(data || []));
  }, [session.user.id]);

  const saveZones = (nextZones) => {
    setZones(nextZones);
    localStorage.setItem('capyf_zones', JSON.stringify(nextZones));
  };

  const addZone = () => {
    const name = newZoneName.trim();
    if (!name || zones.includes(name)) return;
    const next = [...zones, name];
    saveZones(next);
    setSelectedZone(name);
    setNewZoneName('');
    setShowNewZone(false);
  };

  const deleteZone = () => {
    if (zones.length === 1) return;
    const next = zones.filter((zone) => zone !== selectedZone);
    saveZones(next);
    setSelectedZone(next[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    const normalizedMac = macAddress.trim().toUpperCase();
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedMac)) {
      setMessage({ type: 'error', text: 'รูปแบบรหัสอุปกรณ์ไม่ถูกต้อง ตัวอย่างที่ถูกต้อง: 24:0A:C4:00:11:22' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('user_devices').insert({ user_id: session.user.id, device_mac: normalizedMac, zone: selectedZone }).select().single();
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setDevices((items) => [data, ...items]);
      setMacAddress('');
      setMessage({ type: 'success', text: 'เพิ่มอุปกรณ์เรียบร้อยแล้ว CapyF พร้อมรับข้อมูลจากสวน' });
    }
    setLoading(false);
  };

  return (
    <div className="page-wrap device-page">
      <header className="page-header"><div><span className="eyebrow"><Radio size={15} /> เชื่อมต่ออุปกรณ์</span><h1 className="page-title">เพิ่มเซนเซอร์เข้าสวน</h1><p className="page-subtitle">ทำตาม 2 ขั้นตอนง่าย ๆ แล้ว CapyF จะเริ่มรับข้อมูลให้คุณ</p></div></header>

      <div className="device-layout">
        <form onSubmit={handleSubmit} className="panel device-form">
          <div className="form-step"><span>1</span><div><h2>เลือกพื้นที่ติดตั้ง</h2><p>ข้อมูลจะถูกจัดกลุ่มตามพื้นที่นี้</p></div></div>
          <div className="zone-form-row">
            <label className="select-wrap"><MapPin size={18} /><select className="field-select" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>{zones.map((zone) => <option key={zone}>{zone}</option>)}</select><ChevronDown size={17} /></label>
            <button type="button" className="secondary-button compact-button" onClick={() => setShowNewZone((value) => !value)}><Plus size={18} /> เพิ่มพื้นที่</button>
            <button type="button" className="danger-button icon-button" onClick={deleteZone} disabled={zones.length === 1} aria-label="ลบพื้นที่นี้"><Trash2 size={18} /></button>
          </div>
          {showNewZone && <div className="new-zone-row"><input className="field-input" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="เช่น แปลงผักหลังบ้าน" autoFocus /><button type="button" className="primary-button" onClick={addZone}>บันทึกพื้นที่</button></div>}

          <div className="form-divider" />
          <div className="form-step"><span>2</span><div><h2>กรอกรหัสอุปกรณ์ (MAC)</h2><p>ดูรหัสนี้ได้จากสติกเกอร์บนกล่องเซนเซอร์</p></div></div>
          <label><span className="field-label">รหัสอุปกรณ์ 12 หลัก</span><span className="mac-input"><Cpu size={20} /><input className="field-input" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="24:0A:C4:00:11:22" maxLength={17} required /></span></label>
          <div className="device-tip"><Wifi size={18} /><span><strong>ก่อนบันทึก</strong> เปิดอุปกรณ์และตรวจสอบว่าเชื่อมต่ออินเทอร์เน็ตแล้ว</span></div>
          {message.text && <div className={`status-message status-message--${message.type}`}>{message.text}</div>}
          <button className="primary-button submit-device" disabled={loading || !macAddress}>{loading ? 'กำลังเชื่อมต่อ...' : <><CheckCircle2 size={19} /> บันทึกและเริ่มใช้งาน</>}</button>
        </form>

        <aside className="device-side">
          <div className="device-help-card"><span>🦫</span><h2>น้อง Capy แนะนำ</h2><p>ตั้งชื่อพื้นที่ให้จำง่าย เช่น “แปลงพริก” หรือ “โรงเรือน 1” เวลาดูแจ้งเตือนจะรู้ทันทีว่าต้องไปที่ไหน</p></div>
          <div className="panel device-list"><div className="device-list-title"><h2>อุปกรณ์ของฉัน</h2><span>{devices.length} เครื่อง</span></div>{devices.length === 0 ? <div className="empty-device"><Cpu size={26} /><p>ยังไม่มีอุปกรณ์<br /><small>เครื่องแรกของคุณจะแสดงที่นี่</small></p></div> : devices.slice(0, 5).map((device) => <div className="device-row" key={device.id}><span><Cpu size={18} /></span><div><strong>{device.zone || 'ไม่ระบุพื้นที่'}</strong><small>{device.device_mac}</small></div><i title="พร้อมใช้งาน" /></div>)}</div>
        </aside>
      </div>
    </div>
  );
}
