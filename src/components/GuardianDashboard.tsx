import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MapPin, Zap, LogOut, AlertCircle, CheckCircle2, Navigation, Eye, MessageSquare, Map as MapIcon, Phone, UserCheck, ToggleLeft, ToggleRight, Loader } from 'lucide-react';
import axios from 'axios';
import { LiveMap } from './LiveMap';

interface GuardianDashboardProps {
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
    reporter_id: string;
}

interface Resource {
    id: string;
    type: string;
    lat: number;
    lng: number;
    description: string;
}

interface GuardianProfile {
    registered: boolean;
    address?: string;
    lat?: number;
    lng?: number;
    phone?: string;
    is_active?: boolean;
}

interface GeoResult {
    display_name: string;
    lat: string;
    lon: string;
}

export const GuardianDashboard = ({ onLogout, token }: GuardianDashboardProps) => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<GuardianProfile>({ registered: false });
    const [showRegPanel, setShowRegPanel] = useState(false);
    const [regForm, setRegForm] = useState({ address: '', lat: 0, lng: 0, phone: '' });
    const [regStatus, setRegStatus] = useState<'idle' | 'locating' | 'saving' | 'done'>('idle');
    const [isTogglingDuty, setIsTogglingDuty] = useState(false);
    const [geoSuggestions, setGeoSuggestions] = useState<GeoResult[]>([]);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch profile + incidents + resources
    const fetchData = async () => {
        try {
            const [incRes, resRes, profileRes] = await Promise.all([
                axios.get('http://localhost:8000/incidents', { headers }),
                axios.get('http://localhost:8000/resources', { headers }),
                axios.get('http://localhost:8000/guardian/profile', { headers }),
            ]);
            setIncidents(incRes.data.reverse());
            setResources(resRes.data);
            setProfile(profileRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const acknowledgeIncident = async (id: string) => {
        try {
            await axios.post(`http://localhost:8000/incidents/${id}/acknowledge`, {}, { headers });
            setActiveIncidentId(id);
            fetchData();
        } catch (err) {
            console.error('Failed to acknowledge', err);
        }
    };

    const useMyLocation = () => {
        setRegStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setRegForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
                setRegStatus('idle');
            },
            () => setRegStatus('idle'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Debounced Nominatim geocoding
    const handleAddressInput = (value: string) => {
        setRegForm(f => ({ ...f, address: value, lat: 0, lng: 0 }));
        setGeoSuggestions([]);
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        if (value.length < 3) return;
        setIsGeocoding(true);
        geocodeTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=4&countrycodes=in`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data: GeoResult[] = await res.json();
                setGeoSuggestions(data);
            } catch { /* ignore */ } finally {
                setIsGeocoding(false);
            }
        }, 600);
    };

    const selectSuggestion = (result: GeoResult) => {
        setRegForm(f => ({
            ...f,
            address: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        }));
        setGeoSuggestions([]);
    };

    const saveRegistration = async () => {
        if (!regForm.address || !regForm.phone || !regForm.lat) return;
        setRegStatus('saving');
        try {
            await axios.post('http://localhost:8000/guardian/register', regForm, { headers });
            setRegStatus('done');
            setShowRegPanel(false);
            await fetchData();
        } catch {
            setRegStatus('idle');
        }
    };

    const toggleDuty = async () => {
        setIsTogglingDuty(true);
        try {
            if (profile.is_active) {
                await axios.patch('http://localhost:8000/guardian/deactivate', {}, { headers });
            } else {
                await axios.post('http://localhost:8000/guardian/register', {
                    address: profile.address,
                    lat: profile.lat,
                    lng: profile.lng,
                    phone: profile.phone,
                }, { headers });
            }
            await fetchData();
        } finally {
            setIsTogglingDuty(false);
        }
    };

    const activeIncident = incidents.find(i => i.id === activeIncidentId);

    return (
        <div className="fixed inset-0 z-[80] bg-white flex flex-col font-display overflow-hidden">
            {/* Top Status Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-black/40 uppercase tracking-widest">
                        <Zap className="w-3 h-3 text-amber-600" />
                        NODE_GUARDIAN
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {profile.registered && (
                        <button
                            onClick={toggleDuty}
                            disabled={isTogglingDuty}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${profile.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-black/5 border-black/10 text-black/40'}`}
                        >
                            {profile.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                            {profile.is_active ? 'On Duty' : 'Off Duty'}
                        </button>
                    )}
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest">MONITORING_LIVE</span>
                    <button onClick={onLogout} className="p-2 text-black/40 hover:text-black transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-32 gap-6">
                {/* Header */}
                <div className="mt-4">
                    <h1 className="text-4xl font-bold tracking-tighter mb-1 uppercase text-black">GUARDIAN TERMINAL</h1>
                    <p className="text-black/20 text-xs font-mono uppercase tracking-[0.2em]">Situational Awareness Interface</p>
                </div>

                {/* Guardian Registration Panel */}
                {!profile.registered ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-3xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-bold text-sm uppercase tracking-tight text-amber-800">Register as Guardian</div>
                                <div className="text-[10px] text-amber-600/70 font-mono uppercase">Set your patrol area to receive nearby SOS alerts</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    placeholder="Area name (e.g. Velachery, Chennai)"
                                    value={regForm.address}
                                    onChange={e => handleAddressInput(e.target.value)}
                                    className="w-full bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-400"
                                />
                                {isGeocoding && (
                                    <div className="absolute right-4 top-3.5 text-[10px] font-mono text-amber-500">searching...</div>
                                )}
                                {geoSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-amber-200 rounded-2xl mt-1 overflow-hidden shadow-lg">
                                        {geoSuggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectSuggestion(s)}
                                                className="w-full text-left px-4 py-3 text-xs font-mono hover:bg-amber-50 border-b border-amber-100 last:border-0 truncate"
                                            >
                                                📍 {s.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                placeholder="Your phone number (e.g. +919876543210)"
                                value={regForm.phone}
                                onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                                className="w-full bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-400"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={useMyLocation}
                                    disabled={regStatus === 'locating'}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-amber-300 rounded-2xl text-xs font-bold uppercase tracking-widest text-amber-700 hover:bg-amber-50"
                                >
                                    {regStatus === 'locating' ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                    {regStatus === 'locating' ? 'Locating...' : 'Use GPS Instead'}
                                </button>
                                <button
                                    onClick={saveRegistration}
                                    disabled={regStatus === 'saving' || !regForm.address || !regForm.phone || !regForm.lat}
                                    className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-amber-600 disabled:opacity-40"
                                >
                                    {regStatus === 'saving' ? 'Saving...' : 'Activate Guardian Mode'}
                                </button>
                            </div>
                            {regForm.lat !== 0 && (
                                <div className="text-[9px] font-mono text-amber-700/60 text-center">
                                    ✅ Location locked: {regForm.lat.toFixed(5)}, {regForm.lng.toFixed(5)}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-3xl p-4 flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${profile.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-tight text-green-800">
                                {profile.is_active ? 'Guardian Active' : 'Off Duty'}
                            </div>
                            <div className="text-[9px] font-mono text-green-600/60 uppercase">{profile.address} · {profile.phone}</div>
                        </div>
                        <button onClick={() => setShowRegPanel(v => !v)} className="text-[9px] font-bold text-green-700 uppercase tracking-widest underline">
                            Edit
                        </button>
                    </div>
                )}

                {/* Edit Panel */}
                <AnimatePresence>
                    {showRegPanel && profile.registered && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-neutral-50 border border-black/5 rounded-3xl p-5 flex flex-col gap-3">
                                <input
                                    placeholder="Address"
                                    defaultValue={profile.address}
                                    onChange={e => setRegForm(f => ({ ...f, address: e.target.value }))}
                                    className="w-full bg-white border border-black/10 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none"
                                />
                                <input
                                    placeholder="Phone"
                                    defaultValue={profile.phone}
                                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full bg-white border border-black/10 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none"
                                />
                                <div className="flex gap-3">
                                    <button onClick={useMyLocation} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/10 rounded-2xl text-xs font-bold uppercase">
                                        <MapPin className="w-4 h-4" /> Refresh Location
                                    </button>
                                    <button onClick={saveRegistration} className="flex-1 py-3 bg-black text-white rounded-2xl text-xs font-bold uppercase">
                                        Update
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Alert Feed */}
                    <div className="space-y-4">
                        <div className="text-[10px] font-mono text-black/20 uppercase tracking-widest mb-4">Inbound Signals</div>
                        <AnimatePresence>
                            {incidents.filter(i => i.type === 'SOS_SIGNAL' && i.status === 'Active').map((incident) => (
                                <motion.div
                                    key={incident.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-6 rounded-[2rem] border transition-all ${activeIncidentId === incident.id
                                        ? 'bg-amber-50 border-amber-500 shadow-xl shadow-amber-500/10'
                                        : 'bg-white border-black/5 hover:border-black/10 shadow-sm'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
                                                <AlertCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-black font-bold text-lg uppercase tracking-tight">SOS SIGNAL</div>
                                                <div className="text-black/40 text-[10px] font-mono uppercase tracking-widest">ID: {incident.id.substring(0, 8).toUpperCase()}</div>
                                            </div>
                                        </div>
                                        <div className="text-red-600 text-[10px] font-mono font-bold animate-pulse">CRITICAL</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-black/5 rounded-2xl p-3 border border-black/5">
                                            <div className="text-[8px] font-mono text-black/20 uppercase tracking-widest mb-1">Coordinates</div>
                                            <div className="text-[10px] text-black/60 font-mono truncate">{incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</div>
                                        </div>
                                        <div className="bg-black/5 rounded-2xl p-3 border border-black/5">
                                            <div className="text-[8px] font-mono text-black/20 uppercase tracking-widest mb-1">Received</div>
                                            <div className="text-[10px] text-black/60 font-mono">{new Date(incident.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => acknowledgeIncident(incident.id)}
                                            className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeIncidentId === incident.id ? 'bg-amber-500 text-white' : 'bg-black text-white hover:bg-neutral-800'}`}
                                        >
                                            {activeIncidentId === incident.id ? 'RESPONDING' : 'ACKNOWLEDGE'}
                                        </button>
                                        <button
                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`, '_blank')}
                                            className="px-4 py-3 bg-black/5 border border-black/5 rounded-xl hover:bg-black/10 transition-colors"
                                        >
                                            <Navigation className="w-4 h-4 text-black/60" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            {incidents.filter(i => i.type === 'SOS_SIGNAL' && i.status === 'Active').length === 0 && !isLoading && (
                                <div className="p-12 border border-dashed border-black/10 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                    <Eye className="w-8 h-8 text-black/10 mb-4" />
                                    <div className="text-black/20 font-mono text-[10px] uppercase tracking-widest">No Active SOS Signals</div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Live Citizen Location Map - shown when responding */}
                    <div className="flex flex-col gap-4">
                        <div className="text-[10px] font-mono text-black/20 uppercase tracking-widest">
                            {activeIncident ? '🔴 LIVE CITIZEN LOCATION' : 'Tactical Overlay'}
                        </div>
                        <div className="flex-1 min-h-[300px] bg-white border border-black/5 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-black/5">
                            <LiveMap
                                isTracking={true}
                                isSOS={!!activeIncident}
                                resources={[
                                    ...resources,
                                    ...incidents
                                        .filter(i => (i.status === 'Active' || i.status === 'Responding') && i.type === 'SOS_SIGNAL')
                                        .map(i => ({
                                            id: i.id,
                                            lat: i.lat,
                                            lng: i.lng,
                                            type: i.id === activeIncidentId ? 'CITIZEN_SOS' : 'SOS_SIGNAL',
                                            description: i.id === activeIncidentId ? '🔴 Active Citizen — RESPONDING' : 'Pending Response'
                                        }))
                                ]}
                                path={activeIncident ? [[activeIncident.lat, activeIncident.lng]] : undefined}
                            />
                            {activeIncident && (
                                <div className="absolute top-3 left-3 z-[1000] bg-red-600 text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-full animate-pulse">
                                    🔴 Citizen SOS Live {activeIncident.lat.toFixed(4)}, {activeIncident.lng.toFixed(4)}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-2 text-[10px] font-mono text-black/20 uppercase tracking-widest mb-2">
                                    <Navigation className="w-3 h-3" /> Area Status
                                </div>
                                <div className={`text-xl font-bold uppercase ${incidents.filter(i => i.status === 'Active' && i.type === 'SOS_SIGNAL').length > 0 ? 'text-red-600' : 'text-black'}`}>
                                    {incidents.filter(i => i.status === 'Active' && i.type === 'SOS_SIGNAL').length > 0 ? 'ALERT' : 'Normal'}
                                </div>
                            </div>
                            <div className="p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-2 text-[10px] font-mono text-black/20 uppercase tracking-widest mb-2">
                                    <MessageSquare className="w-3 h-3" /> Active SOS
                                </div>
                                <div className="text-xl font-bold text-black">
                                    <span className={incidents.filter(i => i.status === 'Active').length > 0 ? 'text-red-600' : 'text-green-600'}>
                                        {incidents.filter(i => i.status === 'Active').length}
                                    </span>
                                    <span className="text-[10px] text-black/20 font-mono ml-1">SIGNALS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
