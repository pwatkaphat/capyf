import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Cpu, MapPin, Trash2 } from 'lucide-react';

export default function AddDevice({ session }) {
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
  const [macAddress, setMacAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const navigate = useNavigate();

  const handleCreateZone = () => {
    const trimmed = newZoneName.trim();
    if (!trimmed) return;
    if (zones.includes(trimmed)) {
      setSelectedZone(trimmed);
      setIsAddingZone(false);
      return;
    }
    const updated = [...zones, trimmed];
    setZones(updated);
    localStorage.setItem('smartfarm_zones', JSON.stringify(updated));
    setSelectedZone(trimmed);
    setNewZoneName('');
    setIsAddingZone(false);
  };

  const handleDeleteZone = () => {
    if (zones.length <= 1) return; // Prevent deleting the last zone
    const updated = zones.filter((z) => z !== selectedZone);
    setZones(updated);
    localStorage.setItem('smartfarm_zones', JSON.stringify(updated));
    setSelectedZone(updated[0]);
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Try inserting with zone field
    let { error } = await supabase
      .from('user_devices')
      .insert([
        { 
          user_id: session.user.id, 
          device_mac: macAddress,
          zone: selectedZone
        }
      ]);

    // Fallback: If DB schema doesn't have 'zone' column, insert only required columns
    if (error && (error.code === '42703' || (error.message && error.message.includes('column')))) {
      const retry = await supabase
        .from('user_devices')
        .insert([
          { user_id: session.user.id, device_mac: macAddress }
        ]);
      error = retry.error;
    }

    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', message: 'Device connected successfully! Redirecting to Dashboard...' });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">Add Device</h1>
        <p className="text-slate-500 mt-2 font-medium">Register a new sensor device to your system</p>
      </div>

      <div className="glass-card max-w-xl p-8 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Cpu size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Hardware Configuration</h2>
            <p className="text-sm font-medium text-slate-500">Configure zone, sensor type and hardware identity</p>
          </div>
        </div>

        {status.message && (
          <div className={`mb-8 p-5 rounded-2xl text-sm font-medium border ${
            status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleAddDevice} className="space-y-6">
          {/* Zone Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin size={16} className="text-emerald-500" />
                Select Zone
              </label>
              {!isAddingZone ? (
                <button
                  type="button"
                  onClick={() => setIsAddingZone(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  + Create New Zone
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingZone(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-500"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isAddingZone ? (
              <div className="flex gap-2">
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-semibold cursor-pointer"
                >
                  {zones.map((zone) => (
                    <option key={zone} value={zone} className="font-semibold text-slate-700">
                      {zone}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleDeleteZone}
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm flex items-center justify-center"
                  title="Delete selected zone"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Zone D (Pineapple)"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  onClick={handleCreateZone}
                  className="rounded-2xl bg-emerald-600 px-5 text-white font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* MAC Address Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">MAC Address</label>
            <input
              type="text"
              required
              placeholder="XX:XX:XX:XX:XX:XX"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-mono uppercase tracking-widest text-lg"
            />
            <p className="mt-2 text-xs text-slate-400 font-medium">Example: 24:0A:C4:00:11:22</p>
          </div>
          
          <button
            type="submit"
            disabled={loading || !macAddress}
            className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-white font-bold tracking-wide transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-70 mt-4"
          >
            {loading ? 'Connecting...' : 'Save Device'}
          </button>
        </form>
      </div>
    </div>
  );
}
