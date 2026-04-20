import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import axios from 'axios';

interface LoginPageProps {
    onLoginSuccess: (token: string) => void;
    onSwitchToRegister: () => void;
    onBack: () => void;
}

export const LoginPage = ({ onLoginSuccess, onSwitchToRegister, onBack }: LoginPageProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:8000/auth/login', {
                username,
                password,
                email: 'temp@example.com', // Needed by schema but not used for check if username matches
                role: 'Citizen'
            });
            onLoginSuccess(response.data.access_token);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <div className="absolute inset-0 bg-radar-gradient opacity-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md bg-white border border-black/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/[0.05]"
            >
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 text-black/40 hover:text-black transition-colors text-xs font-mono uppercase tracking-widest"
                >
                    ← Back
                </button>

                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="relative mb-6">
                        <Shield className="w-12 h-12 text-black" />
                        <div className="absolute inset-0 bg-black blur-xl opacity-10 -z-10" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter mb-2 text-black">SYSTEM ACCESS</h2>
                    <p className="text-black/30 text-sm font-mono uppercase tracking-widest">Secure Entry Protocol</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-black/20 uppercase tracking-widest ml-4">Identifier</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full bg-black/5 border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-black placeholder:text-black/10 focus:outline-none focus:border-black/30 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-black/20 uppercase tracking-widest ml-4">Encrypted Key</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-black/5 border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-black placeholder:text-black/10 focus:outline-none focus:border-black/30 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-500 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <MagneticButton>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Engage
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </MagneticButton>
                </form>

                <div className="mt-8 text-center text-xs">
                    <span className="text-black/20">New operative? </span>
                    <button
                        onClick={onSwitchToRegister}
                        className="text-black/60 hover:text-black transition-colors underline underline-offset-4"
                    >
                        Create Credentials
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
