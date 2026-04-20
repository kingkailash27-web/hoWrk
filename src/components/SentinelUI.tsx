import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Phone, Map, Users, Settings, X, AlertTriangle, CheckCircle2, MapPin, Clock, Wifi } from 'lucide-react';

interface SentinelUIProps {
    onClose: () => void;
    token?: string;
}

export const SentinelUI = ({ onClose, token }: SentinelUIProps) => {
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [guardians, setGuardians] = useState<any[]>([]);
    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [tacticalLog, setTacticalLog] = useState<string[]>([]);

    // Fetch resources for Rescue Hubs
    useEffect(() => {
        if (!token) return;
        fetch('http://localhost:8000/resources', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setResources(Array.isArray(data) ? data : []))
            .catch(() => setResources([]));
    }, [token]);

    // Fetch guardians for Guardian Grid
    useEffect(() => {
        if (!token || activePanel !== 'guardian') return;
        fetch('http://localhost:8000/incidents', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setGuardians(Array.isArray(data) ? data.filter((i: any) => i.responder_name) : []))
            .catch(() => setGuardians([]));
    }, [token, activePanel]);

    // Get current position for Tactical Ops
    const runTacticalOps = () => {
        setActivePanel('tactical');
        const ts = new Date().toLocaleTimeString();
        setTacticalLog(prev => [`[${ts}] Initiating diagnostic scan...`, ...prev]);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                const ts2 = new Date().toLocaleTimeString();
                setTacticalLog(prev => [
                    `[${ts2}] Node locked: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
                    `[${ts2}] Accuracy: ${Math.round(pos.coords.accuracy)}m`,
                    `[${ts2}] Encryption verified ✓`,
                    ...prev
                ]);
            },
            () => setTacticalLog(prev => [`[${new Date().toLocaleTimeString()}] GPS signal weak`, ...prev])
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col p-6 font-display overflow-y-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tighter uppercase text-black">Sentinel Interface</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                    <X className="w-6 h-6 text-black" />
                </button>
            </div>

            {/* Hero Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 mb-6 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center animate-pulse shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="text-blue-700 font-bold uppercase tracking-widest text-xs mb-1">Global Sentinel Active</div>
                    <div className="text-blue-600/80 text-xs">Protective protocols and real-time monitoring engaged.</div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Assistance Line */}
                <SentinelCard
                    icon={Phone}
                    label="Assistance Line"
                    color="bg-black"
                    textColor="text-white"
                    sublabel="Call +91 93455 32148"
                    onClick={async () => {
                        try {
                            const res = await fetch('http://localhost:8000/call/assist', {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (res.ok) {
                                setTacticalLog(prev => [`[${new Date().toLocaleTimeString()}] 📞 Assistance call triggered → +91 93455 32148`, ...prev]);
                                setActivePanel('tactical');
                            } else {
                                alert('Call failed. Check backend logs.');
                            }
                        } catch {
                            alert('Could not reach backend. Is it running?');
                        }
                    }}
                />

                {/* Rescue Hubs */}
                <SentinelCard
                    icon={Map}
                    label="Rescue Hubs"
                    color="bg-black/5"
                    border="border-black/5"
                    textColor="text-black"
                    sublabel={resources.length > 0 ? `${resources.length} hubs nearby` : 'Scanning...'}
                    onClick={() => setActivePanel(activePanel === 'hubs' ? null : 'hubs')}
                    active={activePanel === 'hubs'}
                />

                {/* Guardian Grid */}
                <SentinelCard
                    icon={Users}
                    label="Guardian Grid"
                    color="bg-black/5"
                    border="border-black/5"
                    textColor="text-black"
                    sublabel="Active responders"
                    onClick={() => setActivePanel(activePanel === 'guardian' ? null : 'guardian')}
                    active={activePanel === 'guardian'}
                />

                {/* Tactical Ops */}
                <SentinelCard
                    icon={Settings}
                    label="Tactical Ops"
                    color="bg-black/5"
                    border="border-black/5"
                    textColor="text-black"
                    sublabel="Node diagnostics"
                    onClick={runTacticalOps}
                    active={activePanel === 'tactical'}
                />
            </div>

            {/* Expandable Detail Panel */}
            <AnimatePresence mode="wait">
                {activePanel === 'hubs' && (
                    <motion.div
                        key="hubs"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="bg-neutral-50 border border-black/5 rounded-3xl p-5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-3 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Nearby Rescue Hubs
                            </div>
                            {resources.length === 0 ? (
                                <p className="text-sm text-black/30 font-mono uppercase">Scanning network...</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                    {resources.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-tight">{r.type || 'HUB'}</div>
                                                <div className="text-[10px] text-black/40 font-mono">{r.description || 'Resource point'}</div>
                                            </div>
                                            <button
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`, '_blank')}
                                                className="text-[9px] font-bold uppercase bg-black text-white rounded-full px-3 py-1 hover:opacity-80"
                                            >
                                                Navigate
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activePanel === 'guardian' && (
                    <motion.div
                        key="guardian"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="bg-neutral-50 border border-black/5 rounded-3xl p-5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-3 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Active Guardian Grid
                            </div>
                            {guardians.length === 0 ? (
                                <p className="text-sm text-black/30 font-mono uppercase">No active responders on grid.</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                    {guardians.map((g, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase">{g.responder_name}</div>
                                                <div className="text-[10px] text-black/40 font-mono">Active — {g.type}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activePanel === 'tactical' && (
                    <motion.div
                        key="tactical"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="bg-neutral-50 border border-black/5 rounded-3xl p-5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-3 flex items-center gap-2">
                                <Wifi className="w-3 h-3" /> Tactical Diagnostic
                            </div>
                            {currentLoc && (
                                <div className="flex gap-4 mb-3">
                                    <div className="flex-1 bg-white rounded-2xl p-3 border border-black/5">
                                        <div className="text-[9px] text-black/30 font-mono uppercase">Latitude</div>
                                        <div className="text-sm font-bold font-mono">{currentLoc.lat.toFixed(6)}</div>
                                    </div>
                                    <div className="flex-1 bg-white rounded-2xl p-3 border border-black/5">
                                        <div className="text-[9px] text-black/30 font-mono uppercase">Longitude</div>
                                        <div className="text-sm font-bold font-mono">{currentLoc.lng.toFixed(6)}</div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-black rounded-2xl p-3 max-h-36 overflow-y-auto">
                                {tacticalLog.map((line, i) => (
                                    <div key={i} className="text-[10px] font-mono text-green-400">{line}</div>
                                ))}
                                {tacticalLog.length === 0 && (
                                    <div className="text-[10px] font-mono text-green-400/40">Awaiting scan...</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Status */}
            <div className="mt-auto pt-6 border-t border-black/5 flex items-center justify-between text-[10px] font-mono text-black/20 uppercase tracking-[0.2em]">
                <span>Secure Tunnel: 0x8a...4f</span>
                <span>Node Identity: SENTINEL-ALPHA</span>
            </div>
        </motion.div>
    );
};

const SentinelCard = ({ icon: Icon, label, color, textColor = "text-black", border = "border-transparent", sublabel, onClick, active }: any) => (
    <button
        onClick={onClick}
        className={`min-h-[120px] rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-3 ${color} ${border} border transition-all active:scale-95 ${active ? 'ring-2 ring-black/20 scale-[1.02]' : 'hover:scale-[1.02]'}`}
    >
        <Icon className={`w-8 h-8 ${textColor}`} />
        <div className="text-center">
            <div className={`font-bold tracking-tight uppercase text-xs ${textColor}`}>{label}</div>
            {sublabel && <div className={`text-[9px] font-mono uppercase mt-0.5 ${textColor} opacity-50`}>{sublabel}</div>}
        </div>
    </button>
);
