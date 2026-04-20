import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MapPin, Zap, Battery, Signal, LogOut, Navigation, AlertCircle, CheckCircle2, Clock, X, Map as MapIcon } from 'lucide-react';
import { LiveMap } from './LiveMap';
import { MagneticButton } from './MagneticButton';
import { SentinelUI } from './SentinelUI';
import axios from 'axios';

interface CitizenDashboardProps {
    onLogout: () => void;
    token: string;
}

export const CitizenDashboard = ({ onLogout, token }: CitizenDashboardProps) => {
    const [isSafeWalkActive, setIsSafeWalkActive] = useState(false);
    const [sosStatus, setSosStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [resources, setResources] = useState<any[]>([]);
    const [countdown, setCountdown] = useState(0);
    const [batteryLevel, setBatteryLevel] = useState(98);
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [isCrisisMode, setIsCrisisMode] = useState(false);
    const [nearestHub, setNearestHub] = useState<any>(null);
    const [lastLoc, setLastLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
    const [responderName, setResponderName] = useState<string | null>(null);
    const [isSentinelOpen, setIsSentinelOpen] = useState(false);
    const [suggestedPath, setSuggestedPath] = useState<[number, number][]>([]);
    const [pathWarnings, setPathWarnings] = useState<string[]>([]);

    // Fetch Resources and calculate nearest
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await axios.get('http://localhost:8000/resources', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data;
                setResources(data);

                // Simple nearest calculation based on index for now, 
                // in real app we'd use geolocation distance
                if (data.length > 0) setNearestHub(data[0]);
            } catch (err) {
                console.error('Failed to fetch resources');
            }
        };
        fetchResources();
    }, [token]);

    // SOS Progress Timer
    useEffect(() => {
        let interval: number;
        if (holdProgress > 0 && holdProgress < 100 && sosStatus === 'idle') {
            interval = window.setInterval(() => {
                setHoldProgress(prev => Math.min(prev + 5, 100));
            }, 50);
        } else if (holdProgress === 100 && sosStatus === 'idle') {
            triggerSOS();
        }
        return () => clearInterval(interval);
    }, [holdProgress, sosStatus]);

    const triggerSOS = async () => {
        setSosStatus('loading');
        setIsCrisisMode(true);

        // Initial location report
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const response = await axios.post('http://localhost:8000/incidents/report', {
                        type: 'SOS_SIGNAL',
                        lat: latitude,
                        lng: longitude
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setActiveIncidentId(response.data.id);
                    setSosStatus('success');
                } catch (e) { setSosStatus('error'); }
            });
        }
    };

    const updateLiveLocation = async (lat: number, lng: number) => {
        setLastLoc({ lat, lng });
        console.log(`Live Sync: ${lat}, ${lng}`);
    };

    const toggleSafeWalk = () => {
        if (isSafeWalkActive) {
            setIsSafeWalkActive(false);
            setSuggestedPath([]);
            setPathWarnings([]);
        } else {
            setIsSafeWalkActive(true);
            setPathWarnings(["SATELLITE SYNC ACTIVE"]);
        }
    };

    // Polling for Responder
    useEffect(() => {
        if (!activeIncidentId || responderName) return;

        const interval = setInterval(async () => {
            try {
                // In a real app we'd get specifically this incident or use a listener
                const response = await axios.get('http://localhost:8000/incidents', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const myIncident = response.data.find((i: any) => i.id === activeIncidentId);
                if (myIncident && myIncident.responder_name) {
                    setResponderName(myIncident.responder_name);
                }
            } catch (e) { console.error('Poll error', e); }
        }, 3000);

        return () => clearInterval(interval);
    }, [activeIncidentId, responderName, token]);

    const findNearestSafetyHub = () => {
        if (!nearestHub) {
            alert("Scanning for nearby relief points...");
            return;
        }
        alert(`NAVIGATING TO NEAREST ${nearestHub.type.toUpperCase()}: ${nearestHub.description}`);
    };

    return (
        <div className={`fixed inset-0 z-[80] transition-colors duration-1000 flex flex-col font-display overflow-hidden ${isCrisisMode ? 'bg-black' : 'bg-white'}`}>
            {/* Background Breathing Animation for Crisis Mode */}
            <AnimatePresence>
                {isCrisisMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.05, 0.1, 0.05]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-white"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Status Bar */}
            <div className={`relative z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b transition-all ${isCrisisMode ? 'bg-black/20 border-white/5' : 'bg-white/80 border-black/5'}`}>
                <div className="flex items-center gap-4">
                    {!isCrisisMode && (
                        <>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-black/40 uppercase tracking-widest">
                                <Battery className={`w-3 h-3 ${batteryLevel < 20 ? 'text-red-500' : 'text-black/40'}`} />
                                {batteryLevel}%
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-black/40 uppercase tracking-widest">
                                <Signal className="w-3 h-3 text-black/40" />
                                5H_ENCRYPTED
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* System Status Removed as requested */}
                </div>

                <button onClick={onLogout} className={`p-2 transition-colors ${isCrisisMode ? 'text-white/20 hover:text-white' : 'text-black/40 hover:text-black'}`}>
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col p-6 overflow-y-auto pb-32">
                {/* Header */}
                <div className={`mb-8 mt-4 text-center transition-all ${isCrisisMode ? 'mt-12' : ''}`}>
                    <h1 className={`text-4xl font-bold tracking-tighter mb-1 uppercase ${isCrisisMode ? 'text-white' : 'text-black'}`}>
                        {isCrisisMode ? 'RESCUE ACTIVE' : 'CITIZEN NODE'}
                    </h1>
                    <p className={`text-xs font-mono uppercase tracking-[0.2em] ${isCrisisMode ? 'text-red-500' : 'text-black/20'}`}>
                        {isCrisisMode ? 'LATENCY: 42MS | TRACKING ON' : 'Verified Registry Interface'}
                    </p>
                </div>

                {/* Safety Insights Bar */}
                <AnimatePresence>
                    {isSafeWalkActive && suggestedPath.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="w-full mb-4 overflow-hidden"
                        >
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                        {Math.round(85)}%
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-tight text-blue-900">Safety Intelligence Verified</div>
                                        <div className="text-[9px] text-blue-700/60 font-mono uppercase">
                                            {pathWarnings.length > 0 ? pathWarnings[0] : 'Historical logs clear for this path.'}
                                        </div>
                                    </div>
                                </div>
                                <Shield className="w-4 h-4 text-blue-200" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Action Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full">

                    {/* SOS Button with Progress Ring */}
                    <div className="relative w-full aspect-square max-w-[280px]">
                        {/* Progress Ring SVG */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="48%"
                                className={`fill-none stroke-current transition-all duration-200 ${isCrisisMode ? 'text-red-500/20' : 'text-black/5'}`}
                                strokeWidth="4"
                            />
                            <circle
                                cx="50%"
                                cy="50%"
                                r="48%"
                                className={`fill-none stroke-current transition-all duration-200 ${sosStatus === 'success' ? 'text-green-500' : 'text-red-600'}`}
                                strokeWidth="4"
                                strokeDasharray="301.59"
                                strokeDashoffset={301.59 - (301.59 * holdProgress) / 100}
                                strokeLinecap="round"
                            />
                        </svg>

                        <button
                            onMouseDown={() => setHoldProgress(1)}
                            onMouseUp={() => setHoldProgress(0)}
                            onMouseLeave={() => setHoldProgress(0)}
                            onTouchStart={() => setHoldProgress(1)}
                            onTouchEnd={() => setHoldProgress(0)}
                            className={`relative w-full h-full rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 ${isCrisisMode
                                ? 'bg-transparent border border-white/10'
                                : 'bg-white border border-black/5 shadow-2xl shadow-black/5'
                                }`}
                        >
                            <AnimatePresence mode="wait">
                                {sosStatus === 'idle' && (
                                    <motion.div
                                        key="idle"
                                        className="flex flex-col items-center gap-4"
                                        animate={{ scale: holdProgress > 0 ? 0.95 : 1 }}
                                    >
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${holdProgress > 0 ? 'bg-red-500 scale-110' : 'bg-red-600'}`}>
                                            <AlertCircle className="w-10 h-10 text-white" />
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-4xl font-black tracking-widest mb-1 ${isCrisisMode ? 'text-white' : 'text-black'}`}>SOS</div>
                                            <div className={`text-[10px] font-mono uppercase tracking-widest ${isCrisisMode ? 'text-white/40' : 'text-black/40'}`}>Hold 2s</div>
                                        </div>
                                    </motion.div>
                                )}
                                {sosStatus === 'loading' && (
                                    <motion.div key="loading" className="flex flex-col items-center gap-4">
                                        <Zap className="w-20 h-20 text-red-500 animate-pulse" />
                                        <div className="text-xl font-bold text-white uppercase tracking-tighter">Broadcasting...</div>
                                    </motion.div>
                                )}
                                {sosStatus === 'success' && (
                                    <motion.div key="success" className="flex flex-col items-center gap-4">
                                        <CheckCircle2 className="w-20 h-20 text-green-500 transition-all duration-700 scale-125" />
                                        <div className="text-xl font-bold text-white uppercase tracking-tighter text-center px-4">
                                            {responderName ? `${responderName.toUpperCase()} IS ON THE WAY` : 'GUARDIANS ALERTED'}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    {/* Map Interface - Now Live */}
                    <div className={`w-full relative transition-all duration-700 overflow-hidden ${isSafeWalkActive || isCrisisMode ? 'h-64 mb-4' : 'h-0 opacity-0'}`}>
                        <div className="text-[10px] font-mono text-black/20 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <MapIcon className="w-3 h-3" />
                            Tactical Satellite Feed
                        </div>
                        <LiveMap
                            isTracking={isSafeWalkActive}
                            isSOS={isCrisisMode}
                            resources={resources}
                            path={suggestedPath}
                            onLocationUpdate={updateLiveLocation}
                        />
                    </div>

                    {/* Adaptive Action Buttons */}
                    <div className="w-full flex flex-col gap-4 min-h-[140px]">
                        {isCrisisMode ? (
                            <>
                                <button
                                    onClick={findNearestSafetyHub}
                                    className="w-full py-6 bg-white text-black rounded-3xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-100 transition-colors"
                                >
                                    <Navigation className="w-6 h-6" />
                                    Navigate to Nearest Hub
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCrisisMode(false);
                                        setSosStatus('idle');
                                        setHoldProgress(0);
                                    }}
                                    className="w-full py-4 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Cancel Emergency / I am Secure
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={toggleSafeWalk}
                                    className={`rounded-3xl p-6 border transition-all flex flex-col items-center justify-center gap-3 ${isSafeWalkActive ? 'bg-black text-white border-black' : 'bg-white border-black/5'}`}
                                >
                                    {isSafeWalkActive ? <CheckCircle2 className="w-8 h-8 text-green-500 animate-pulse" /> : <Navigation className="w-8 h-8 text-black/60" />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {isSafeWalkActive ? 'Reached Safely' : 'Safe Walk'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setIsSentinelOpen(true)}
                                    className="rounded-3xl p-6 bg-black text-white border border-black/5 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform"
                                >
                                    <Shield className="w-8 h-8 text-white" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sentinel Ops</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <AnimatePresence>
                {isSentinelOpen && (
                    <SentinelUI onClose={() => setIsSentinelOpen(false)} token={token} />
                )}
            </AnimatePresence>
        </div>
    );
};
