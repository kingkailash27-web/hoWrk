import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, MapPin } from 'lucide-react';
import axios from 'axios';

interface Incident {
    id: string;
    type: string;
    lat: number;
    lng: number;
    timestamp: string;
}

export const LiveIncidents = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await axios.get('http://localhost:8000/incidents');
                setIncidents(response.data.slice(-5).reverse());
            } catch (err) {
                console.error('Failed to fetch public incidents');
            }
        };
        fetchIncidents();
        const interval = setInterval(fetchIncidents, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto mt-20">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-black/10" />
                <div className="flex items-center gap-2 text-[10px] font-mono text-black/40 uppercase tracking-[0.3em]">
                    Live_Network_Signals
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-black/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {incidents.map((incident, idx) => (
                        <motion.div
                            key={incident.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 rounded-3xl bg-white border border-black/5 shadow-xl shadow-black/[0.03] group hover:border-black/10 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="text-[10px] font-mono text-black/20 uppercase">
                                    #{incident.id.substring(0, 6).toUpperCase()}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-sm font-bold text-black mb-1 uppercase tracking-tight">
                                    {incident.type.replace('_', ' ')}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-black/30 font-mono">
                                    <Clock className="w-3 h-3" />
                                    {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-black/40 font-mono leading-none">
                                <MapPin className="w-3 h-3 text-black/20" />
                                {incident.lat.toFixed(3)}, {incident.lng.toFixed(3)}
                            </div>
                        </motion.div>
                    ))}
                    {incidents.length === 0 && (
                        <div className="col-span-full py-12 text-center text-black/20 font-mono text-xs uppercase tracking-widest border border-dashed border-black/10 rounded-3xl">
                            Monitoring global urban nodes...
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
