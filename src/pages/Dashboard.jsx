import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SensorCard from '../components/SensorCard';
import { Thermometer, Droplets, Sprout, FlaskConical, Power, Bell, AlertTriangle, CheckCircle, Info, Activity, MapPin, ChevronDown } from 'lucide-react';

export default function Dashboard() {
  const [sensorData, setSensorData] = useState({ 
    temperature: null, 
    humidity: null,
    soil_moisture: null,
    soil_ph: null,
    pump_status: null
  });
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultZones = [
    'Zone A (Main Field)',
    'Zone B (Greenhouse 1)',
    'Zone C (Orchard)'
  ];

  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem('smartfarm_zones');
    return saved ? JSON.parse(saved) : defaultZones;
  });

  const [selectedZone, setSelectedZone] = useState(zones[0]);

  useEffect(() => {
    const fetchLatestData = async () => {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error && data.length > 0) {
        setHistoryData(data);
        setSensorData(data[0]);
      }
      setLoading(false);
    };

    fetchLatestData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_data' },
        (payload) => {
          const newData = payload.new;
          setSensorData(newData);
          setHistoryData((prev) => {
            const updated = [newData, ...prev];
            if (updated.length > 20) updated.pop();
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  // Helper to format pump status
  const getPumpStatus = (status) => {
    if (status === true || status === 'ON' || status === 1) return 'ON';
    return 'OFF';
  };
  
  // Format time for alerts
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Generate alarm logs based on history
  const generateAlarmLogs = () => {
    const logs = [];
    
    // We look at all historyData (up to 20 records)
    historyData.forEach((data, index) => {
      const timeStr = formatTime(data.created_at);
      
      // Check conditions for this specific timestamp
      if (data.temperature > 35) {
        logs.push({ id: `log-temp-hi-${data.id || index}`, message: `Air temperature is too high (${data.temperature}°C). Sprinklers are recommended.`, time: timeStr, Icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' });
      }
      if (data.temperature < 20 && data.temperature !== null) {
        logs.push({ id: `log-temp-low-${data.id || index}`, message: `Air temperature is low (${data.temperature}°C). Suggest reducing watering.`, time: timeStr, Icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' });
      }
      if (data.soil_moisture !== null && data.soil_moisture < 30) {
        logs.push({ id: `log-moist-${data.id || index}`, message: `Soil moisture is low (${data.soil_moisture}%). Water pump should be turned on.`, time: timeStr, Icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' });
      }
      if (data.pump_status === true || data.pump_status === 1 || data.pump_status === 'ON') {
        logs.push({ id: `log-pump-on-${data.id || index}`, message: 'Sensor detected that the water pump is currently active.', time: timeStr, Icon: Power, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' });
      }
    });

    if (logs.length === 0 && historyData.length > 0) {
      const timeStr = formatTime(historyData[0].created_at);
      logs.push({ id: 'log-ok', message: 'All environmental parameters are within optimal ranges (Normal).', time: timeStr, Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' });
    }

    return logs;
  };

  const handlePumpToggle = async () => {
    const nextStatus = !sensorData?.pump_status;
    
    // Update local state optimistically
    setSensorData(prev => ({ ...prev, pump_status: nextStatus }));

    if (sensorData?.id) {
      const { error } = await supabase
        .from('sensor_data')
        .update({ pump_status: nextStatus })
        .eq('id', sensorData.id);
      
      if (error) {
        console.error("Error updating pump status:", error);
        // Revert if error occurs
        setSensorData(prev => ({ ...prev, pump_status: !nextStatus }));
      }
    } else {
      const { error } = await supabase
        .from('sensor_data')
        .insert([{ pump_status: nextStatus }]);
      
      if (error) {
        console.error("Error inserting pump status:", error);
        setSensorData(prev => ({ ...prev, pump_status: !nextStatus }));
      }
    }
  };

  const alarmLogs = generateAlarmLogs();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Realtime Connected</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Farm Overview</h1>
          <p className="text-slate-500 mt-2 font-medium">Live feeds from agricultural IoT sensors</p>
        </div>

        {/* Custom styled Zone Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="appearance-none bg-white/70 backdrop-blur-md border border-emerald-100/50 shadow-sm rounded-2xl pl-10 pr-10 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone} className="font-semibold text-slate-700 bg-white">
                  {zone}
                </option>
              ))}
            </select>
            {/* Left side MapPin Icon */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-600">
              <MapPin size={16} strokeWidth={2.5} />
            </div>
            {/* Right side custom dropdown Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600">
              <ChevronDown size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Sensor Cards (4 columns on large screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SensorCard 
          title="Air Temperature" 
          value={sensorData?.temperature} 
          unit="°C" 
          icon={Thermometer}
          colorClass={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
        />
        <SensorCard 
          title="Air Humidity" 
          value={sensorData?.humidity} 
          unit="%" 
          icon={Droplets}
          colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
        />
        <SensorCard 
          title="Soil Moisture" 
          value={sensorData?.soil_moisture} 
          unit="%" 
          icon={Sprout}
          colorClass={{ bg: 'bg-amber-100', text: 'text-amber-700' }}
        />
        <SensorCard 
          title="Soil pH" 
          value={sensorData?.soil_ph} 
          unit="pH" 
          icon={FlaskConical}
          colorClass={{ bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' }}
        />
      </div>

      {/* Row 2: 2-column layout (Pump Card: 1/3 width, Logs: 2/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Pump Card with Toggle Switch */}
        <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between min-h-[220px] lg:col-span-1">
          <div className="absolute -right-6 -top-6 w-32 h-32 opacity-20 blur-2xl rounded-full bg-cyan-100 transition-all duration-500 group-hover:opacity-40 group-hover:scale-150"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Power size={28} strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold text-slate-600">Water Pump</h2>
            </div>
            
            {/* Dark green toggle switch container */}
            <div className="bg-[#0b4635] border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between mt-auto shadow-inner">
              <span className="text-sm md:text-base font-bold text-emerald-100 tracking-wide">
                {sensorData?.pump_status ? 'Active' : 'Inactive'}
              </span>
              <button 
                onClick={handlePumpToggle}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                  sensorData?.pump_status ? 'bg-white' : 'bg-[#05291f]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full shadow-md ring-0 transition duration-300 ease-in-out ${
                    sensorData?.pump_status 
                      ? 'translate-x-6 bg-[#0b4635]' 
                      : 'translate-x-0 bg-white'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Alarm History Log Section */}
        <div className="glass-card p-6 md:p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-6 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d1fae5] text-emerald-700">
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Alarm Logs</h2>
                <p className="text-sm font-medium text-slate-500">Chronological environmental events and suggestions</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {alarmLogs.map((log) => (
              <div 
                key={log.id} 
                className={`flex items-start md:items-center justify-between p-4 rounded-2xl border ${log.bg} ${log.border} transition-all duration-300 hover:shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 ${log.color}`}>
                    <log.Icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{log.message}</p>
                  </div>
                </div>
                <div className="mt-2 md:mt-0 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1">
                    Time: {log.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
