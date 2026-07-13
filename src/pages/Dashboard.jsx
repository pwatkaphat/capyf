import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, Clock3, Droplets, FlaskConical, Lightbulb, MapPin, Power, RefreshCw, Sprout, Thermometer, Wifi } from 'lucide-react';
import { supabase } from '../supabaseClient';
import SensorCard from '../components/SensorCard';
import './Dashboard.css';

const defaultZones = ['แปลง A · แปลงหลัก', 'โรงเรือน 1', 'สวนผลไม้'];
const loadZones = () => {
  const saved = localStorage.getItem('capyf_zones') || localStorage.getItem('smartfarm_zones');
  try { return saved ? JSON.parse(saved) : defaultZones; } catch { return defaultZones; }
};
const pumpIsOn = (value) => value === true || value === 1 || value === 'ON' || value === 'on';

export default function Dashboard({ session }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [zones] = useState(loadZones);
  const [selectedZone, setSelectedZone] = useState(zones[0]);

  useEffect(() => {
    const fetchLatestData = async () => {
      const { data } = await supabase.from('sensor_data').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(30);
      setHistoryData(data || []);
      setLoading(false);
    };
    fetchLatestData();

    const channel = supabase.channel(`capyf-sensors-${session.user.id}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'sensor_data', filter: `user_id=eq.${session.user.id}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') setHistoryData((items) => [payload.new, ...items].slice(0, 30));
      if (payload.eventType === 'UPDATE') setHistoryData((items) => items.map((item) => item.id === payload.new.id ? payload.new : item));
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session.user.id]);

  const zoneData = useMemo(() => {
    const exact = historyData.filter((item) => item.zone === selectedZone);
    return exact.length ? exact : historyData.filter((item) => !item.zone);
  }, [historyData, selectedZone]);
  const sensorData = useMemo(() => zoneData[0] || {}, [zoneData]);
  const isPumpOn = pumpIsOn(sensorData.pump_status);

  const status = useMemo(() => {
    const issues = [];
    if (sensorData.temperature > 35) issues.push(`อากาศร้อน ${sensorData.temperature}°C`);
    if (sensorData.temperature !== null && sensorData.temperature < 20) issues.push(`อากาศเย็น ${sensorData.temperature}°C`);
    if (sensorData.soil_moisture !== null && sensorData.soil_moisture < 30) issues.push(`ดินแห้ง เหลือ ${sensorData.soil_moisture}%`);
    if (sensorData.soil_ph && (sensorData.soil_ph < 5.5 || sensorData.soil_ph > 8)) issues.push(`ค่า pH ควรตรวจสอบ`);
    return issues;
  }, [sensorData]);

  const handlePumpToggle = async () => {
    setPumpLoading(true);
    const nextStatus = !isPumpOn;
    const response = sensorData.id
      ? await supabase.from('sensor_data').update({ pump_status: nextStatus }).eq('id', sensorData.id).eq('user_id', session.user.id).select().single()
      : await supabase.from('sensor_data').insert({ user_id: session.user.id, zone: selectedZone, pump_status: nextStatus }).select().single();
    if (response.data) {
      setHistoryData((items) => sensorData.id ? items.map((item) => item.id === response.data.id ? response.data : item) : [response.data, ...items]);
    }
    setPumpLoading(false);
  };

  const formatUpdate = (value) => {
    if (!value) return 'ยังไม่มีข้อมูลจากเซนเซอร์';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  };

  if (loading) return <div className="app-loading"><RefreshCw className="dashboard-spinner" /><p>กำลังอ่านข้อมูลจากสวน...</p></div>;

  return (
    <div className="page-wrap dashboard-page">
      <header className="page-header">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> เชื่อมต่อข้อมูลแบบเรียลไทม์</span><h1 className="page-title">วันนี้สวนเป็นอย่างไรบ้าง?</h1><p className="page-subtitle">CapyF สรุปให้ดูง่าย ตัดสินใจดูแลสวนได้ทันที</p></div>
        <label className="zone-picker" aria-label="เลือกพื้นที่ในสวน"><MapPin size={18} /><select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>{zones.map((zone) => <option key={zone}>{zone}</option>)}</select><ChevronDown size={17} /></label>
      </header>

      <section className={status.length ? 'farm-summary farm-summary--warning' : 'farm-summary'}>
        <div className="summary-illustration">{status.length ? '🌤️' : '🌿'}</div>
        <div className="summary-copy"><span>{status.length ? 'มีเรื่องที่ควรดูแล' : 'สวนของคุณสบายดี'}</span><h2>{status.length ? status[0] : 'ค่าต่าง ๆ อยู่ในช่วงน่าพอใจ'}</h2><p>{status.length > 1 ? `และอีก ${status.length - 1} รายการที่ควรตรวจสอบ` : 'เดินระบบตามปกติได้เลย เดี๋ยว CapyF ช่วยเฝ้าดูให้'}</p></div>
        <div className="summary-time"><Clock3 size={16} /><span>อัปเดตล่าสุด<br /><strong>{formatUpdate(sensorData.created_at)}</strong></span></div>
      </section>

      <div className="sensor-grid">
        <SensorCard title="อุณหภูมิอากาศ" value={sensorData.temperature} unit="°C" icon={Thermometer} tone="orange" status={sensorData.temperature > 35 ? 'ค่อนข้างร้อน' : 'กำลังดี'} hint="เหมาะประมาณ 20–35°C" />
        <SensorCard title="ความชื้นในอากาศ" value={sensorData.humidity} unit="%" icon={Droplets} tone="blue" hint="ช่วยดูสภาพอากาศรอบพืช" />
        <SensorCard title="ความชื้นในดิน" value={sensorData.soil_moisture} unit="%" icon={Sprout} tone="green" status={sensorData.soil_moisture < 30 ? 'ดินเริ่มแห้ง' : 'ดินชุ่มดี'} hint="ควรรักษาไว้มากกว่า 30%" />
        <SensorCard title="ค่าความเป็นกรด–ด่าง" value={sensorData.soil_ph} unit="pH" icon={FlaskConical} tone="purple" hint="พืชส่วนใหญ่ชอบ pH 5.5–8.0" />
      </div>

      <div className="dashboard-bottom-grid">
        <section className="panel care-panel">
          <div className="section-title"><span className="section-icon"><Lightbulb size={21} /></span><div><h2>คำแนะนำจาก CapyF</h2><p>เรื่องสำคัญที่ช่วยให้ดูแลสวนง่ายขึ้น</p></div></div>
          <div className="care-list">
            {status.length ? status.map((item) => <div className="care-item care-item--warning" key={item}><AlertTriangle size={20} /><span><strong>{item}</strong><small>ลองตรวจสภาพจริงที่แปลงและปรับการดูแลตามความเหมาะสม</small></span></div>) : <div className="care-item"><CheckCircle2 size={20} /><span><strong>ทุกอย่างอยู่ในเกณฑ์ดี</strong><small>ยังไม่ต้องทำอะไรเพิ่มเติม ระบบจะคอยแจ้งเมื่อมีค่าเปลี่ยนแปลง</small></span></div>}
            {!sensorData.id && <div className="care-item care-item--info"><Wifi size={20} /><span><strong>ยังไม่พบข้อมูลในพื้นที่นี้</strong><small>เพิ่มอุปกรณ์หรือเลือกพื้นที่ที่มีเซนเซอร์เพื่อเริ่มดูข้อมูล</small></span></div>}
          </div>
        </section>

        <section className={isPumpOn ? 'panel pump-panel is-on' : 'panel pump-panel'}>
          <div className="pump-heading"><span><Power size={22} /></span><div><h2>ปั๊มน้ำ</h2><p>{isPumpOn ? 'กำลังรดน้ำอยู่' : 'ปิดอยู่ พร้อมใช้งาน'}</p></div></div>
          <div className="pump-visual"><span className="pump-drop">💧</span><i /><i /><i /></div>
          <button type="button" className={isPumpOn ? 'pump-button is-on' : 'pump-button'} onClick={handlePumpToggle} disabled={pumpLoading}><Power size={19} />{pumpLoading ? 'กำลังสั่งงาน...' : isPumpOn ? 'หยุดรดน้ำ' : 'เปิดปั๊มน้ำ'}</button>
          <small className="pump-note"><Activity size={14} /> ตรวจสอบพื้นที่ก่อนเปิดปั๊มทุกครั้ง</small>
        </section>
      </div>
    </div>
  );
}
