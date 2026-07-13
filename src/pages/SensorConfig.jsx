import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, ChevronDown, Droplets, Gauge, MapPin, Save, Thermometer, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import './SensorConfig.css';

const defaultZones = ['แปลง A · แปลงหลัก', 'โรงเรือน 1', 'สวนผลไม้'];
const defaultConfig = { tempMax: 35, tempMin: 20, moistureMin: 30, phMax: 8, phMin: 5.5, autoWatering: true, autoWateringThreshold: 35, tempTriggerEnabled: false, tempTriggerThreshold: 38, triggerMode: 'OR' };
const getZones = () => {
  const saved = localStorage.getItem('capyf_zones') || localStorage.getItem('smartfarm_zones');
  try { return saved ? JSON.parse(saved) : defaultZones; } catch { return defaultZones; }
};

export default function SensorConfig() {
  const [zones] = useState(getZones);
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('capyf_thresholds') || localStorage.getItem('smartfarm_thresholds');
    try { return saved ? JSON.parse(saved) : Object.fromEntries(zones.map((zone) => [zone, { ...defaultConfig }])); } catch { return Object.fromEntries(zones.map((zone) => [zone, { ...defaultConfig }])); }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setThresholds((current) => {
      const next = { ...current };
      zones.forEach((zone) => { if (!next[zone]) next[zone] = { ...defaultConfig }; });
      return next;
    });
  }, [zones]);

  const config = { ...defaultConfig, ...thresholds[selectedZone] };
  const update = (field, value) => setThresholds((current) => ({ ...current, [selectedZone]: { ...defaultConfig, ...current[selectedZone], [field]: value } }));
  const handleSave = (event) => {
    event.preventDefault();
    localStorage.setItem('capyf_thresholds', JSON.stringify(thresholds));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-wrap config-page">
      <header className="page-header">
        <div><span className="eyebrow"><Gauge size={15} /> ตั้งค่าการดูแลอัตโนมัติ</span><h1 className="page-title">บอก CapyF ว่าควรแจ้งเมื่อไร</h1><p className="page-subtitle">เลื่อนค่าตามที่ต้องการ ระบบจะใช้เป็นเกณฑ์เฝ้าดูสวน</p></div>
        <label className="zone-picker"><MapPin size={18} /><select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>{zones.map((zone) => <option key={zone}>{zone}</option>)}</select><ChevronDown size={17} /></label>
      </header>

      {saved && <div className="status-message status-message--success config-success"><CheckCircle2 size={18} /> บันทึกการตั้งค่าของ “{selectedZone}” แล้ว</div>}

      <form onSubmit={handleSave} className="config-layout">
        <div className="config-main">
          <section className="panel config-card">
            <div className="config-card-heading"><span className="config-icon config-icon--yellow"><BellRing size={21} /></span><div><h2>เกณฑ์แจ้งเตือน</h2><p>ถ้าค่าเกินช่วงนี้ CapyF จะแจ้งให้ทราบ</p></div></div>
            <div className="range-grid">
              <RangeSetting icon={Thermometer} title="อุณหภูมิสูงสุด" help="อากาศร้อนเกินไป" value={config.tempMax} min={25} max={50} unit="°C" onChange={(value) => update('tempMax', value)} />
              <RangeSetting icon={Thermometer} title="อุณหภูมิต่ำสุด" help="อากาศเย็นเกินไป" value={config.tempMin} min={10} max={25} unit="°C" onChange={(value) => update('tempMin', value)} />
              <RangeSetting icon={Droplets} title="ความชื้นดินต่ำสุด" help="ดินเริ่มแห้ง ควรตรวจดู" value={config.moistureMin} min={10} max={60} unit="%" onChange={(value) => update('moistureMin', value)} />
            </div>
            <div className="ph-setting"><div><strong>ช่วงค่า pH ที่เหมาะสม</strong><small>ระบบจะแจ้งเมื่อค่าอยู่นอกช่วง</small></div><label>ต่ำสุด<input type="number" step="0.1" min="3" max="7" value={config.phMin} onChange={(e) => update('phMin', Number(e.target.value))} /></label><span>ถึง</span><label>สูงสุด<input type="number" step="0.1" min="7" max="10" value={config.phMax} onChange={(e) => update('phMax', Number(e.target.value))} /></label></div>
          </section>

          <section className="panel config-card">
            <div className="config-card-heading"><span className="config-icon config-icon--blue"><Zap size={21} /></span><div><h2>สั่งรดน้ำอัตโนมัติ</h2><p>กำหนดเงื่อนไขให้ปั๊มน้ำเริ่มทำงานเอง</p></div></div>
            <div className="logic-picker"><div><strong>เมื่อเข้าเงื่อนไข</strong><small>เลือกว่าจะใช้เพียงข้อเดียวหรือทุกข้อพร้อมกัน</small></div><span><button type="button" className={config.triggerMode === 'OR' ? 'is-active' : ''} onClick={() => update('triggerMode', 'OR')}>ข้อใดข้อหนึ่ง</button><button type="button" className={config.triggerMode === 'AND' ? 'is-active' : ''} onClick={() => update('triggerMode', 'AND')}>ครบทุกข้อ</button></span></div>
            <AutomationRule icon={Droplets} title="ดินแห้ง" help="เปิดปั๊มเมื่อความชื้นในดินต่ำกว่า" enabled={config.autoWatering} onToggle={() => update('autoWatering', !config.autoWatering)} value={config.autoWateringThreshold} min={15} max={60} unit="%" onChange={(value) => update('autoWateringThreshold', value)} />
            <AutomationRule icon={Thermometer} title="อากาศร้อน" help="เปิดปั๊มเพื่อช่วยลดอุณหภูมิเมื่อสูงกว่า" enabled={config.tempTriggerEnabled} onToggle={() => update('tempTriggerEnabled', !config.tempTriggerEnabled)} value={config.tempTriggerThreshold} min={30} max={48} unit="°C" onChange={(value) => update('tempTriggerThreshold', value)} />
          </section>
        </div>

        <aside className="config-side">
          <div className="config-note"><span>🌱</span><h2>ค่าที่แนะนำ</h2><p>พืชแต่ละชนิดต้องการน้ำและอุณหภูมิต่างกัน ใช้ค่าเริ่มต้นไปก่อน แล้วค่อยปรับตามชนิดพืชและสภาพจริงในสวน</p></div>
          <button type="submit" className="primary-button save-config"><Save size={19} /> บันทึกการตั้งค่า</button>
        </aside>
      </form>
    </div>
  );
}

function RangeSetting({ icon: Icon, title, help, value, min, max, unit, onChange }) {
  return <div className="range-setting"><div className="range-label"><span><Icon size={18} /></span><div><strong>{title}</strong><small>{help}</small></div><b>{value}{unit}</b></div><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>;
}

function AutomationRule({ icon: Icon, title, help, enabled, onToggle, value, min, max, unit, onChange }) {
  return <div className={enabled ? 'automation-rule is-enabled' : 'automation-rule'}><div className="automation-heading"><span><Icon size={19} /></span><div><strong>{title}</strong><small>{help}</small></div><button type="button" onClick={onToggle} aria-label={`${enabled ? 'ปิด' : 'เปิด'}เงื่อนไข ${title}`}>{enabled ? <ToggleRight size={39} /> : <ToggleLeft size={39} />}</button></div><div className="automation-range"><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={!enabled} /><b>{value}{unit}</b></div></div>;
}
