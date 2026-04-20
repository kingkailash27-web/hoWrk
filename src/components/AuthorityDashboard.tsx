import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MapPin, Zap, LogOut, AlertCircle, CheckCircle2, Navigation, Trash2, Plus, Home, Activity } from 'lucide-react';
import axios from 'axios';

interface AuthorityDashboardProps {
    onLogout: () => void;
    token: string;
}

interface Incident {
    id: string;
    type: string;
    lat: number;
    lng: number;
    status: string;
    timestamp: string;
}

interface Resource {
    id: string;
    type: string;
    lat: number;
    lng: number;
    description: string;
}

export const AuthorityDashboard = ({ onLogout, token }: AuthorityDashboardProps) => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddResource, setShowAddResource] = useState(false);
    const [newResource, setNewResource] = useState({ type: 'Safe Shelter', lat: 12.9716, lng: 77.5946, description: '' });

    const fetchData = async () => {
        try {
            const [incRes, resRes] = await Promise.all([
                axios.get('http://localhost:8000/incidents', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:8000/resources', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setIncidents(incRes.data.reverse());
            setResources(resRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const resolveIncident = async (id: string) => {
        try {
            await axios.patch(`http://localhost:8000/incidents/${id}`, { status: 'Resolved' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Failed to resolve incident');
        }
    };

    const addResource = async () => {
        try {
            await axios.post('http://localhost:8000/resources', newResource, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddResource(false);
            fetchData();
        } catch (err) {
            alert('Failed to add resource');
        }
    };

    const deleteResource = async (id: string) => {
        try {
            await axios.delete(`http://localhost:8000/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Failed to delete resource');
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-white flex flex-col font-display overflow-hidden">
            {/* Top Status Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-black/40 uppercase tracking-widest">
                        <Shield className="w-3 h-3 text-black" />
                        AUTHORITY_COMMAND_HQ
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest">GRID_SYNCHRONIZED</span>
                </div>

                <button onClick={onLogout} className="p-2 text-black/40 hover:text-black transition-colors">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Incident & Resource Management */}
                <div className="w-96 bg-black/[0.02] border-r border-black/5 flex flex-col overflow-y-auto p-6 scrollbar-hide">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tighter mb-1 uppercase text-black">Command Terminal</h1>
                        <p className="text-black/20 text-[10px] font-mono uppercase tracking-[0.2em]">City-Wide Grid Control</p>
                    </div>

                    {/* Active Incidents Section */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono text-black/20 uppercase tracking-widest">Active Bursts</span>
                            <span className="bg-red-500/10 text-red-600 text-[8px] font-mono px-2 py-0.5 rounded-full border border-red-500/20">
                                {incidents.filter(i => i.status === 'Active').length} READY
                            </span>
                        </div>
                        <div className="space-y-3">
                            {incidents.filter(i => i.status === 'Active').map(incident => (
                                <div key={incident.id} className="p-4 bg-white border border-black/5 rounded-2xl shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-black uppercase">{incident.type}</span>
                                        <button onClick={() => resolveIncident(incident.id)} className="text-[8px] font-mono text-green-600 hover:underline">RESOLVE</button>
                                    </div>
                                    <div className="text-[10px] text-black/40 font-mono mb-2">{incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</div>
                                    <div className="text-[8px] text-black/20 font-mono italic">{new Date(incident.timestamp).toLocaleTimeString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources Management Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono text-black/20 uppercase tracking-widest">Grid Resources</span>
                            <button onClick={() => setShowAddResource(true)} className="p-1 text-black/40 hover:text-black transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {resources.map(res => (
                                <div key={res.id} className="p-4 bg-white border border-black/5 rounded-2xl flex justify-between items-center group shadow-sm">
                                    <div>
                                        <div className="text-xs font-bold text-blue-600 uppercase">{res.type}</div>
                                        <div className="text-[8px] text-black/40 font-mono">{res.description}</div>
                                    </div>
                                    <button onClick={() => deleteResource(res.id)} className="p-2 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Global Map View */}
                <div className="flex-1 bg-white relative">
                    <div className="absolute inset-0 bg-radar-gradient opacity-5" />
                    <div className="absolute inset-0 grayscale opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,11/1200x800?access_token=none')] bg-cover" />

                    {/* Map Legend */}
                    <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl p-4 z-10 space-y-2 shadow-xl">
                        <div className="flex items-center gap-2 text-[8px] font-mono text-black tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> ACTIVE_SOS
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-mono text-black tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-blue-600" /> SAFE_SHELTER
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-mono text-black tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-green-600" /> MEDICAL_TENT
                        </div>
                    </div>

                    {/* Incident Pins */}
                    {incidents.filter(i => i.status === 'Active').map((i, idx) => (
                        <div key={i.id} className="absolute" style={{ top: `${30 + (idx * 8)}%`, left: `${40 + (idx * 5)}%` }}>
                            <div className="relative group cursor-pointer" onClick={() => resolveIncident(i.id)}>
                                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-mono px-2 py-0.5 rounded text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">RESOLVE</div>
                            </div>
                        </div>
                    ))}

                    {/* Resource Pins */}
                    {resources.map((r, idx) => (
                        <div key={r.id} className="absolute" style={{ top: `${50 + (idx * 7)}%`, left: `${20 + (idx * 12)}%` }}>
                            <div className="relative group cursor-pointer">
                                {r.type === 'Safe Shelter' ? <Home className="w-5 h-5 text-blue-600" /> : <Activity className="w-5 h-5 text-green-600" />}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[8px] font-mono px-2 py-0.5 border border-black/5 rounded text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm uppercase">{r.type}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Resource Modal */}
            <AnimatePresence>
                {showAddResource && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-md bg-white border border-black/10 rounded-[2.5rem] p-10 shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold mb-6 tracking-tighter text-black uppercase">Initialize Resource</h2>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-[10px] font-mono text-black/20 uppercase tracking-widest ml-4 mb-2 block">Descriptor</label>
                                    <select
                                        value={newResource.type}
                                        onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                                        className="w-full bg-black/5 border border-black/10 rounded-2xl py-4 px-6 text-black text-sm focus:outline-none focus:border-black/30 appearance-none"
                                    >
                                        <option value="Safe Shelter">SAFE_SHELTER</option>
                                        <option value="Medical Tent">MEDICAL_TENT</option>
                                        <option value="Food/Water">LOGISTICS_CORE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono text-black/20 uppercase tracking-widest ml-4 mb-2 block">Notes</label>
                                    <input
                                        type="text"
                                        value={newResource.description}
                                        onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                        placeholder="Details (e.g., Capacity: 50)"
                                        className="w-full bg-black/5 border border-black/10 rounded-2xl py-4 px-6 text-black text-sm focus:outline-none focus:border-black/30"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={addResource} className="flex-1 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors">DEPLOY</button>
                                <button onClick={() => setShowAddResource(false)} className="flex-1 py-4 bg-black/5 text-black/40 border border-black/5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black/10 transition-colors">ABORT</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
