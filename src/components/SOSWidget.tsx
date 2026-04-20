import { useState } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { ShieldAlert, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export const SOSWidget = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const triggerSOS = async () => {
        setStatus('loading');

        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Assuming a demo user token for now, or get from localStorage
                    const token = localStorage.getItem('token');

                    await axios.post('http://localhost:8000/incidents/report', {
                        type: 'SOS_SIGNAL',
                        lat: latitude,
                        lng: longitude
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    setStatus('success');
                    setTimeout(() => setStatus('idle'), 5000);
                } catch (err: any) {
                    setStatus('error');
                    setErrorMessage(err.response?.data?.detail || 'Failed to send SOS signal');
                }
            },
            (error) => {
                setStatus('error');
                setErrorMessage(error.message);
            }
        );
    };

    return (
        <div className="fixed bottom-12 right-12 z-[60]">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={status === 'idle' ? triggerSOS : undefined}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-colors duration-500 border border-black/5 ${status === 'loading' ? 'bg-amber-50' :
                    status === 'success' ? 'bg-green-50' :
                        status === 'error' ? 'bg-red-50' :
                            'bg-white'
                    }`}
            >
                <div className="absolute inset-0 rounded-full bg-black opacity-5 animate-ping" />

                {status === 'idle' && (
                    <ShieldAlert className="w-10 h-10 text-black" />
                )}
                {status === 'loading' && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <MapPin className="w-10 h-10 text-amber-600" />
                    </motion.div>
                )}
                {status === 'success' && (
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                )}
                {status === 'error' && (
                    <AlertCircle className="w-10 h-10 text-red-600" />
                )}

                <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-[10px] font-bold text-white px-3 py-1 rounded-full whitespace-nowrap shadow-xl uppercase tracking-widest">
                    {status === 'idle' ? 'One-Tap SOS' :
                        status === 'loading' ? 'Locating...' :
                            status === 'success' ? 'Sent!' : 'Failed'}
                </span>
            </motion.button>

            {status === 'error' && (
                <div className="absolute bottom-28 right-0 bg-red-500/10 border border-red-500/20 backdrop-blur-md p-3 rounded-xl text-xs text-red-400 w-48 text-right">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};
