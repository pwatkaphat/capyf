import { useState, useEffect } from 'react';
import { Sliders, MapPin, Save, BellRing, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SensorConfig() {
  const defaultZones = ['Zone A (Main Field)', 'Zone B (Greenhouse 1)', 'Zone C (Orchard)'];
  const [zones] = useState(() => {
    const saved = localStorage.getItem('smartfarm_zones');
    return saved ? JSON.parse(saved) : defaultZones;
  });

  const [selectedZone, setSelectedZone] = useState(zones[0]);

  // Thresholds state per zone
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('smartfarm_thresholds');
    if (saved) return JSON.parse(saved);
    
    // Default config template for all zones
    const config = {};
    zones.forEach(zone => {
      config[zone] = {
        tempMax: 35,
        tempMin: 20,
        moistureMin: 30,
        phMax: 8.0,
        phMin: 5.5,
        autoWatering: true,
        autoWateringThreshold: 35,
        tempTriggerEnabled: false,
        tempTriggerThreshold: 38,
        triggerMode: 'OR',
      };
    });
    return config;
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  // Update thresholds structure if a new zone was added recently
  useEffect(() => {
    setThresholds(prev => {
      const updated = { ...prev };
      let changed = false;
      zones.forEach(zone => {
        if (!updated[zone]) {
          updated[zone] = {
            tempMax: 35,
            tempMin: 20,
            moistureMin: 30,
            phMax: 8.0,
            phMin: 5.5,
            autoWatering: true,
            autoWateringThreshold: 35,
            tempTriggerEnabled: false,
            tempTriggerThreshold: 38,
            triggerMode: 'OR',
          };
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('smartfarm_thresholds', JSON.stringify(updated));
      }
      return updated;
    });
  }, [zones]);

  const handleInputChange = (field, value) => {
    setThresholds(prev => {
      const updated = {
        ...prev,
        [selectedZone]: {
          ...prev[selectedZone],
          [field]: value
        }
      };
      return updated;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('smartfarm_thresholds', JSON.stringify(thresholds));
    setStatus({ type: 'success', message: `Configuration for ${selectedZone} saved successfully!` });
    setTimeout(() => setStatus({ type: '', message: '' }), 3000);
  };

  const getSafeConfig = (config) => {
    return {
      tempMax: 35,
      tempMin: 20,
      moistureMin: 30,
      phMax: 8.0,
      phMin: 5.5,
      autoWatering: true,
      autoWateringThreshold: 35,
      tempTriggerEnabled: false,
      tempTriggerThreshold: 38,
      triggerMode: 'OR',
      ...config
    };
  };

  const currentConfig = getSafeConfig(thresholds[selectedZone]);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Sensor Configuration</h1>
          <p className="text-slate-500 mt-2 font-medium">Set thresholds and automation parameters zone by zone</p>
        </div>

        {/* Zone Selector */}
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
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-600">
              <MapPin size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {status.message && (
        <div className="mb-8 p-5 rounded-2xl text-sm font-bold border bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm">
          {status.message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Environment Alarms */}
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-emerald-50 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <BellRing size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Alarm Thresholds</h2>
              <p className="text-sm font-medium text-slate-500">Define triggers for notification warnings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Air Temperature */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-l-4 border-orange-500 pl-3">Air Temperature Limits</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Temperature Limit ({currentConfig.tempMax}°C)</label>
                <input
                  type="range"
                  min="25"
                  max="50"
                  value={currentConfig.tempMax}
                  onChange={(e) => handleInputChange('tempMax', parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min Temperature Limit ({currentConfig.tempMin}°C)</label>
                <input
                  type="range"
                  min="10"
                  max="25"
                  value={currentConfig.tempMin}
                  onChange={(e) => handleInputChange('tempMin', parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Soil Moisture & pH */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-l-4 border-amber-500 pl-3">Soil Moisture & pH Limits</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min Soil Moisture Warning ({currentConfig.moistureMin}%)</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={currentConfig.moistureMin}
                  onChange={(e) => handleInputChange('moistureMin', parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Min pH</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="7.0"
                    value={currentConfig.phMin}
                    onChange={(e) => handleInputChange('phMin', parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Max pH</label>
                  <input
                    type="number"
                    step="0.1"
                    min="7.0"
                    max="10.0"
                    value={currentConfig.phMax}
                    onChange={(e) => handleInputChange('phMax', parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Irrigation Automation */}
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-emerald-5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Sliders size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Irrigation Automation</h2>
              <p className="text-sm font-medium text-slate-500">Configure conditional rules for automatic water pump activation</p>
            </div>
          </div>

          {/* Trigger Condition Logic Selector */}
          <div className="mb-6 bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Trigger Rule Logic</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Combine conditions using AND or OR operators</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
              <button
                type="button"
                onClick={() => handleInputChange('triggerMode', 'OR')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  currentConfig.triggerMode === 'OR' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ANY (OR)
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('triggerMode', 'AND')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  currentConfig.triggerMode === 'AND' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ALL (AND)
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Condition 1: Soil Moisture */}
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Trigger by Soil Moisture</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Activate pump when soil moisture is dry</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('autoWatering', !currentConfig.autoWatering)}
                  className="focus:outline-none text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {currentConfig.autoWatering ? (
                    <ToggleRight size={40} strokeWidth={1.5} />
                  ) : (
                    <ToggleLeft size={40} strokeWidth={1.5} className="text-slate-300" />
                  )}
                </button>
              </div>

              <div className={`transition-all duration-300 ${currentConfig.autoWatering ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Trigger pump if soil moisture drops below</label>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{currentConfig.autoWateringThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={currentConfig.autoWateringThreshold}
                  onChange={(e) => handleInputChange('autoWateringThreshold', parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Condition 2: Air Temperature */}
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Trigger by Air Temperature</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Activate pump for cooling down when weather is hot</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('tempTriggerEnabled', !currentConfig.tempTriggerEnabled)}
                  className="focus:outline-none text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {currentConfig.tempTriggerEnabled ? (
                    <ToggleRight size={40} strokeWidth={1.5} />
                  ) : (
                    <ToggleLeft size={40} strokeWidth={1.5} className="text-slate-300" />
                  )}
                </button>
              </div>

              <div className={`transition-all duration-300 ${currentConfig.tempTriggerEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Trigger pump if temperature rises above</label>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{currentConfig.tempTriggerThreshold}°C</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="48"
                  value={currentConfig.tempTriggerThreshold}
                  onChange={(e) => handleInputChange('tempTriggerThreshold', parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-white font-bold tracking-wide transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
        >
          <Save size={18} />
          Save Configuration
        </button>
      </form>
    </div>
  );
}
