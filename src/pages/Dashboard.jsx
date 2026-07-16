import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BellRing,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cpu,
  Droplets,
  FlaskConical,
  Gauge,
  Lightbulb,
  MapPin,
  Power,
  RefreshCw,
  Sprout,
  Thermometer,
  TrendingDown,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../supabaseClient';
import './Dashboard.css';

const defaultZones = ['แปลง A · แปลงหลัก', 'โรงเรือน 1', 'สวนผลไม้'];
const defaultThresholds = { tempMax: 35, tempMin: 20, moistureMin: 30, phMax: 8, phMin: 5.5 };
const ONLINE_WINDOW = 20 * 60 * 1000;

const loadLocalZones = () => {
  const saved = localStorage.getItem('capyf_zones') || localStorage.getItem('smartfarm_zones');
  try { return saved ? JSON.parse(saved) : defaultZones; } catch { return defaultZones; }
};

const loadThresholds = () => {
  const saved = localStorage.getItem('capyf_thresholds') || localStorage.getItem('smartfarm_thresholds');
  try { return saved ? JSON.parse(saved) : {}; } catch { return {}; }
};

const pumpIsOn = (value) => value === true || value === 1 || value === 'ON' || value === 'on';
const hasNumber = (value) => value !== null && value !== undefined && Number.isFinite(Number(value));
const mean = (values) => {
  const valid = values.filter(hasNumber).map(Number);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};
const formatNumber = (value, digits = 1) => hasNumber(value) ? Number(value).toFixed(digits) : '--';
const shortMac = (mac) => mac ? mac.split(':').slice(-3).join(':') : 'ไม่ระบุรหัส';

function latestByDevice(rows) {
  const result = new Map();
  rows.forEach((row) => {
    const key = row.device_mac ? String(row.device_mac).toUpperCase() : `legacy:${row.zone || 'unknown'}`;
    if (!result.has(key)) result.set(key, row);
  });
  return result;
}

function buildChartData(rows, range) {
  const now = Date.now();
  const rangeMs = range === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const bucketMs = range === '24h' ? 2 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const buckets = new Map();

  rows.forEach((row) => {
    const timestamp = new Date(row.created_at).getTime();
    if (!Number.isFinite(timestamp) || timestamp < now - rangeMs) return;
    const key = Math.floor(timestamp / bucketMs) * bucketMs;
    if (!buckets.has(key)) buckets.set(key, { timestamp: key, temperature: [], soil: [], humidity: [] });
    const bucket = buckets.get(key);
    if (hasNumber(row.temperature)) bucket.temperature.push(Number(row.temperature));
    if (hasNumber(row.soil_moisture)) bucket.soil.push(Number(row.soil_moisture));
    if (hasNumber(row.humidity)) bucket.humidity.push(Number(row.humidity));
  });

  return [...buckets.values()].sort((a, b) => a.timestamp - b.timestamp).map((bucket) => ({
    timestamp: bucket.timestamp,
    label: new Intl.DateTimeFormat('th-TH', range === '24h'
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: '2-digit' }).format(bucket.timestamp),
    temperature: mean(bucket.temperature),
    soil: mean(bucket.soil),
    humidity: mean(bucket.humidity),
  }));
}

function buildAiInsights(devices, readings, history, thresholds) {
  const insights = [];
  const now = Date.now();

  devices.forEach((device) => {
    const reading = readings.get(String(device.device_mac).toUpperCase());
    const name = device.zone ? `อุปกรณ์ ${shortMac(device.device_mac)}` : shortMac(device.device_mac);
    if (!reading || now - new Date(reading.created_at).getTime() > ONLINE_WINDOW) {
      insights.push({
        id: `offline-${device.device_mac}`,
        severity: 'critical',
        icon: WifiOff,
        title: `${name} ขาดการเชื่อมต่อ`,
        detail: reading ? 'ไม่มีข้อมูลใหม่เกิน 20 นาที อาจเกิดจากไฟเลี้ยงหรือสัญญาณ Wi‑Fi' : 'ยังไม่เคยได้รับข้อมูลจากอุปกรณ์นี้',
        action: 'ตรวจไฟเลี้ยงและสัญญาณอินเทอร์เน็ตของอุปกรณ์',
      });
      return;
    }
    if (hasNumber(reading.soil_moisture) && Number(reading.soil_moisture) < thresholds.moistureMin) {
      insights.push({
        id: `soil-${device.device_mac}`,
        severity: Number(reading.soil_moisture) < thresholds.moistureMin - 10 ? 'critical' : 'warning',
        icon: Droplets,
        title: `${name} ตรวจพบดินแห้ง`,
        detail: `ความชื้นดิน ${formatNumber(reading.soil_moisture)}% ต่ำกว่าเกณฑ์ ${thresholds.moistureMin}%`,
        action: 'ตรวจหัวจ่ายน้ำและพิจารณาเปิดปั๊มในแปลงนี้',
      });
    }
    if (hasNumber(reading.temperature) && Number(reading.temperature) > thresholds.tempMax) {
      insights.push({
        id: `temp-${device.device_mac}`,
        severity: 'warning',
        icon: Thermometer,
        title: `${name} อุณหภูมิสูง`,
        detail: `วัดได้ ${formatNumber(reading.temperature)}°C สูงกว่าเกณฑ์ ${thresholds.tempMax}°C`,
        action: 'เพิ่มการระบายอากาศหรือให้น้ำในช่วงที่เหมาะสม',
      });
    }
    if (hasNumber(reading.soil_ph) && (Number(reading.soil_ph) < thresholds.phMin || Number(reading.soil_ph) > thresholds.phMax)) {
      insights.push({
        id: `ph-${device.device_mac}`,
        severity: 'warning',
        icon: FlaskConical,
        title: `${name} ค่า pH นอกช่วง`,
        detail: `วัดได้ pH ${formatNumber(reading.soil_ph)} ควรอยู่ระหว่าง ${thresholds.phMin}–${thresholds.phMax}`,
        action: 'ตรวจซ้ำด้วยชุดทดสอบดินก่อนปรับสภาพดิน',
      });
    }
  });

  const recentSoil = history.filter((row) => hasNumber(row.soil_moisture)).slice(0, 12);
  if (recentSoil.length >= 6) {
    const latestAverage = mean(recentSoil.slice(0, 3).map((row) => row.soil_moisture));
    const olderAverage = mean(recentSoil.slice(-3).map((row) => row.soil_moisture));
    if (hasNumber(latestAverage) && hasNumber(olderAverage) && olderAverage - latestAverage >= 8) {
      insights.push({
        id: 'soil-trend', severity: 'info', icon: TrendingDown,
        title: 'AI พบแนวโน้มความชื้นดินลดลงเร็ว',
        detail: `ค่าเฉลี่ยลดลงประมาณ ${formatNumber(olderAverage - latestAverage)}% จากข้อมูลช่วงล่าสุด`,
        action: 'ติดตามอีก 1–2 รอบ และตรวจระบบน้ำหากค่ายังลดต่อเนื่อง',
      });
    }
  }

  const priority = { critical: 0, warning: 1, info: 2 };
  return insights.sort((a, b) => priority[a.severity] - priority[b.severity]).slice(0, 5);
}

export default function Dashboard({ session }) {
  const [historyData, setHistoryData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pumpLoading, setPumpLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [chartRange, setChartRange] = useState('24h');

  const fetchDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setRefreshing(true);
    setLoadError('');
    const [sensorResponse, deviceResponse] = await Promise.all([
      supabase.from('sensor_data').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1000),
      supabase.from('user_devices').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true }),
    ]);
    if (sensorResponse.error || deviceResponse.error) {
      setLoadError('อ่านข้อมูลบางส่วนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
    setHistoryData(sensorResponse.data || []);
    setDevices(deviceResponse.data || []);
    setLoading(false);
    setRefreshing(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchDashboard({ quiet: true });
    const channel = supabase.channel(`capyf-all-devices-${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'sensor_data', filter: `user_id=eq.${session.user.id}`,
      }, (payload) => setHistoryData((items) => [payload.new, ...items].slice(0, 1000)))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sensor_data', filter: `user_id=eq.${session.user.id}`,
      }, (payload) => setHistoryData((items) => items.map((item) => item.id === payload.new.id ? payload.new : item)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboard, session.user.id]);

  const zones = useMemo(() => {
    const names = [...devices.map((device) => device.zone), ...historyData.map((row) => row.zone), ...loadLocalZones()].filter(Boolean);
    return [...new Set(names)];
  }, [devices, historyData]);

  useEffect(() => {
    if (!selectedZone && zones.length) setSelectedZone(zones[0]);
    if (selectedZone && zones.length && !zones.includes(selectedZone)) setSelectedZone(zones[0]);
  }, [selectedZone, zones]);

  const zoneDevices = useMemo(() => devices.filter((device) => device.zone === selectedZone), [devices, selectedZone]);
  const registeredMacs = useMemo(() => new Set(zoneDevices.map((device) => String(device.device_mac).toUpperCase())), [zoneDevices]);
  const zoneData = useMemo(() => historyData.filter((row) => row.zone === selectedZone || registeredMacs.has(String(row.device_mac).toUpperCase())), [historyData, registeredMacs, selectedZone]);
  const readings = useMemo(() => latestByDevice(zoneData), [zoneData]);
  const latestReadings = useMemo(() => {
    const rows = zoneDevices.map((device) => readings.get(String(device.device_mac).toUpperCase())).filter(Boolean);
    if (!rows.length && zoneData.length) return [...latestByDevice(zoneData).values()];
    return rows;
  }, [readings, zoneData, zoneDevices]);
  const latestReading = zoneData[0] || {};
  const isPumpOn = latestReadings.some((row) => pumpIsOn(row.pump_status));
  const onlineDevices = zoneDevices.filter((device) => {
    const reading = readings.get(String(device.device_mac).toUpperCase());
    return reading && Date.now() - new Date(reading.created_at).getTime() <= ONLINE_WINDOW;
  }).length;
  const thresholds = useMemo(() => ({ ...defaultThresholds, ...loadThresholds()[selectedZone] }), [selectedZone]);
  const insights = useMemo(() => buildAiInsights(zoneDevices, readings, zoneData, thresholds), [readings, thresholds, zoneData, zoneDevices]);
  const chartData = useMemo(() => buildChartData(zoneData, chartRange), [chartRange, zoneData]);
  const averages = useMemo(() => ({
    temperature: mean(latestReadings.map((row) => row.temperature)),
    humidity: mean(latestReadings.map((row) => row.humidity)),
    soil: mean(latestReadings.map((row) => row.soil_moisture)),
    ph: mean(latestReadings.map((row) => row.soil_ph)),
  }), [latestReadings]);

  const handlePumpToggle = async () => {
    setPumpLoading(true);
    const nextStatus = !isPumpOn;
    try {
      const targets = zoneDevices.length ? zoneDevices : devices;
      if (targets.length) {
        const commandResponse = await supabase.from('device_commands').upsert(
          targets.map(({ device_mac }) => ({ user_id: session.user.id, device_mac, pump_status: nextStatus, updated_at: new Date().toISOString() })),
          { onConflict: 'user_id,device_mac' },
        );
        if (commandResponse.error) throw commandResponse.error;
      }

      if (latestReading.id) {
        const response = await supabase.from('sensor_data').update({ pump_status: nextStatus }).eq('id', latestReading.id).eq('user_id', session.user.id).select().single();
        if (response.error) throw response.error;
        if (response.data) setHistoryData((items) => items.map((item) => item.id === response.data.id ? response.data : item));
      }
    } catch {
      setLoadError('ส่งคำสั่งปั๊มน้ำไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง');
    } finally {
      setPumpLoading(false);
    }
  };

  const formatUpdate = (value) => {
    if (!value) return 'ยังไม่มีข้อมูล';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  };

  if (loading) return <div className="app-loading"><RefreshCw className="dashboard-spinner" /><p>กำลังรวมข้อมูลจากทุกอุปกรณ์...</p></div>;

  return (
    <div className="page-wrap dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> ข้อมูลสดจากทุกอุปกรณ์ในแปลง</span>
          <h1 className="page-title">ศูนย์ควบคุมแปลงของคุณ</h1>
          <p className="page-subtitle">ดูสุขภาพทั้งแปลง แนวโน้ม และสิ่งที่ควรลงมือทำได้ในหน้าเดียว</p>
        </div>
        <div className="dashboard-header-actions">
          <label className="zone-picker" aria-label="เลือกแปลง"><MapPin size={18} /><select value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)}>{zones.map((zone) => <option key={zone}>{zone}</option>)}</select><ChevronDown size={17} /></label>
          <button type="button" className="refresh-button" onClick={() => fetchDashboard()} disabled={refreshing} aria-label="รีเฟรชข้อมูล"><RefreshCw size={18} className={refreshing ? 'dashboard-spinner' : ''} /><span>รีเฟรช</span></button>
        </div>
      </header>

      {loadError && <div className="status-message status-message--error dashboard-error"><AlertTriangle size={18} />{loadError}</div>}

      <section className={insights.some((item) => item.severity === 'critical') ? 'farm-overview farm-overview--warning' : 'farm-overview'}>
        <div className="farm-score"><span>{insights.length ? <Bot size={30} /> : <CheckCircle2 size={30} />}</span><div><small>AI FARM STATUS</small><strong>{insights.length ? `${insights.length} เรื่องควรตรวจสอบ` : 'ทุกระบบทำงานปกติ'}</strong><p>{insights[0]?.title || 'ค่าล่าสุดของทุกอุปกรณ์อยู่ในช่วงที่ตั้งไว้'}</p></div></div>
        <div className="farm-overview-meta"><Clock3 size={16} /><span>ข้อมูลล่าสุด<strong>{formatUpdate(latestReading.created_at)}</strong></span></div>
      </section>

      <section className="overview-grid" aria-label="สรุปภาพรวมแปลง">
        <MetricCard icon={Cpu} label="อุปกรณ์ในแปลง" value={zoneDevices.length} unit="เครื่อง" hint={`${onlineDevices} เครื่องออนไลน์`} tone="green" />
        <MetricCard icon={Sprout} label="ความชื้นดินเฉลี่ย" value={formatNumber(averages.soil)} unit="%" hint={`เกณฑ์ขั้นต่ำ ${thresholds.moistureMin}%`} tone="blue" />
        <MetricCard icon={Thermometer} label="อุณหภูมิเฉลี่ย" value={formatNumber(averages.temperature)} unit="°C" hint={`ความชื้นอากาศ ${formatNumber(averages.humidity)}%`} tone="orange" />
        <MetricCard icon={BellRing} label="AI แจ้งเตือน" value={insights.length} unit="รายการ" hint={insights.some((item) => item.severity === 'critical') ? 'มีเรื่องเร่งด่วน' : 'ไม่มีเรื่องเร่งด่วน'} tone="purple" />
      </section>

      <div className="dashboard-main-grid">
        <section className="panel chart-panel">
          <div className="panel-heading chart-heading">
            <div><span className="section-kicker"><Activity size={15} /> สถิติทั้งแปลง</span><h2>แนวโน้มจากทุกอุปกรณ์</h2><p>ค่าเฉลี่ยตามช่วงเวลาของอุปกรณ์ใน {selectedZone}</p></div>
            <div className="range-tabs" aria-label="เลือกช่วงเวลา"><button type="button" className={chartRange === '24h' ? 'is-active' : ''} onClick={() => setChartRange('24h')}>24 ชม.</button><button type="button" className={chartRange === '7d' ? 'is-active' : ''} onClick={() => setChartRange('7d')}>7 วัน</button></div>
          </div>
          <div className="chart-wrap">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: -22 }}>
                  <CartesianGrid stroke="#e6ece2" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#7c8b80', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis yAxisId="percent" domain={[0, 100]} tick={{ fill: '#7c8b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="temp" orientation="right" domain={['dataMin - 3', 'dataMax + 3']} hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line yAxisId="percent" type="monotone" dataKey="soil" name="ความชื้นดิน" stroke="#4f9560" strokeWidth={3} dot={false} activeDot={{ r: 5 }} connectNulls />
                  <Line yAxisId="percent" type="monotone" dataKey="humidity" name="ความชื้นอากาศ" stroke="#3a8995" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                  <Line yAxisId="temp" type="monotone" dataKey="temperature" name="อุณหภูมิ" stroke="#d4873c" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState icon={Gauge} title="ข้อมูลยังไม่พอสร้างกราฟ" text="เมื่ออุปกรณ์ส่งข้อมูลอย่างน้อย 2 ช่วงเวลา กราฟจะแสดงที่นี่" />}
          </div>
          <div className="chart-summary"><span><Droplets size={16} /> ดินเฉลี่ย <strong>{formatNumber(averages.soil)}%</strong></span><span><Thermometer size={16} /> อุณหภูมิเฉลี่ย <strong>{formatNumber(averages.temperature)}°C</strong></span><span><FlaskConical size={16} /> pH เฉลี่ย <strong>{formatNumber(averages.ph)}</strong></span></div>
        </section>

        <section className="panel ai-panel">
          <div className="panel-heading ai-heading"><span className="ai-icon"><Bot size={23} /></span><div><span className="section-kicker">CAPYF AI</span><h2>สิ่งที่ควรดูแล</h2><p>วิเคราะห์จากค่าล่าสุด แนวโน้ม และเกณฑ์ที่ตั้งไว้</p></div></div>
          <div className="insight-list">
            {insights.length ? insights.map((insight) => <InsightCard key={insight.id} insight={insight} />) : <div className="ai-all-good"><CheckCircle2 size={32} /><strong>ยังไม่พบความผิดปกติ</strong><p>AI จะเฝ้าดูข้อมูลใหม่และแจ้งเตือนเมื่อมีความเสี่ยง</p></div>}
          </div>
          <div className="ai-footnote"><Lightbulb size={15} /> คำแนะนำเป็นการวิเคราะห์เบื้องต้น ควรตรวจสภาพจริงในแปลงก่อนดำเนินการ</div>
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="panel devices-panel">
          <div className="panel-heading devices-heading"><div><span className="section-kicker"><Wifi size={15} /> อุปกรณ์ในแปลง</span><h2>สถานะแต่ละจุดตรวจวัด</h2></div><span className="device-count">{onlineDevices}/{zoneDevices.length} ออนไลน์</span></div>
          <div className="device-table-wrap">
            {zoneDevices.length ? <table className="device-table"><thead><tr><th>อุปกรณ์</th><th>สถานะ</th><th>อุณหภูมิ</th><th>ความชื้นดิน</th><th>pH</th><th>อัปเดตล่าสุด</th></tr></thead><tbody>{zoneDevices.map((device, index) => <DeviceRow key={device.id} device={device} reading={readings.get(String(device.device_mac).toUpperCase())} index={index} />)}</tbody></table> : <EmptyState icon={Cpu} title="ยังไม่มีอุปกรณ์ในแปลงนี้" text="เพิ่มอุปกรณ์และเลือกแปลงให้ตรงกัน แล้วข้อมูลจะมารวมที่หน้านี้" />}
          </div>
        </section>

        <section className={isPumpOn ? 'panel pump-panel is-on' : 'panel pump-panel'}>
          <div className="pump-heading"><span><Power size={22} /></span><div><h2>ปั๊มน้ำทั้งแปลง</h2><p>{isPumpOn ? 'มีอุปกรณ์กำลังรดน้ำ' : 'ทุกอุปกรณ์พร้อมรับคำสั่ง'}</p></div></div>
          <div className="pump-status-visual"><span className="pump-ring"><Droplets size={31} /></span><strong>{isPumpOn ? 'กำลังทำงาน' : 'ปิดอยู่'}</strong><small>คำสั่งจะส่งไปยัง {zoneDevices.length || devices.length} อุปกรณ์</small></div>
          <button type="button" className={isPumpOn ? 'pump-button is-on' : 'pump-button'} onClick={handlePumpToggle} disabled={pumpLoading || (!zoneDevices.length && !devices.length)}><Power size={19} />{pumpLoading ? 'กำลังส่งคำสั่ง...' : isPumpOn ? 'หยุดรดน้ำทั้งแปลง' : 'เปิดปั๊มทั้งแปลง'}</button>
          <small className="pump-note"><AlertTriangle size={14} /> ตรวจพื้นที่ก่อนสั่งงานปั๊มทุกครั้ง</small>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, hint, tone }) {
  return <article className={`overview-card overview-card--${tone}`}><span className="overview-icon"><Icon size={22} /></span><div><p>{label}</p><strong>{value}<small>{unit}</small></strong><span>{hint}</span></div></article>;
}

function InsightCard({ insight }) {
  const Icon = insight.icon;
  return <article className={`insight-card insight-card--${insight.severity}`}><span><Icon size={19} /></span><div><strong>{insight.title}</strong><p>{insight.detail}</p><small><Lightbulb size={13} />{insight.action}</small></div></article>;
}

function DeviceRow({ device, reading, index }) {
  const online = reading && Date.now() - new Date(reading.created_at).getTime() <= ONLINE_WINDOW;
  const updated = reading ? new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(reading.created_at)) : 'ยังไม่มีข้อมูล';
  return <tr><td><div className="device-name"><span>{index + 1}</span><div><strong>จุดวัด {index + 1}</strong><small>{shortMac(device.device_mac)}</small></div></div></td><td><span className={online ? 'device-status is-online' : 'device-status'}><i />{online ? 'ออนไลน์' : 'ออฟไลน์'}</span></td><td>{formatNumber(reading?.temperature)}°C</td><td>{formatNumber(reading?.soil_moisture)}%</td><td>{formatNumber(reading?.soil_ph)}</td><td className="device-updated">{updated}</td></tr>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const units = { temperature: '°C', soil: '%', humidity: '%' };
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.dataKey}><i style={{ background: item.color }} />{item.name}<b>{formatNumber(item.value)}{units[item.dataKey]}</b></span>)}</div>;
}

function EmptyState({ icon: Icon, title, text }) {
  return <div className="dashboard-empty"><span><Icon size={24} /></span><strong>{title}</strong><p>{text}</p></div>;
}
