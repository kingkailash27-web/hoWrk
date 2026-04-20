import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { Shield, ArrowRight, Menu, X, Globe, Lock, Cpu, Zap } from 'lucide-react';
import { Hero3D } from './components/Hero3D';
import { MagneticButton } from './components/MagneticButton';
import { TextReveal } from './components/TextReveal';
import { HorizontalTimeline } from './components/HorizontalTimeline';
import { SOSWidget } from './components/SOSWidget';
import { SentinelUI } from './components/SentinelUI';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { CitizenDashboard } from './components/CitizenDashboard';
import { GuardianDashboard } from './components/GuardianDashboard';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSentinelMode, setIsSentinelMode] = useState(false);
  const [authView, setAuthView] = useState<'none' | 'login' | 'register'>('none');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:8000/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (err) {
          handleLogout();
        }
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthView('none');
  };

  if (token && user) {
    if (user.role === 'Authority') {
      return <AuthorityDashboard onLogout={handleLogout} token={token} />;
    }
    if (user.role === 'Guardian') {
      return <GuardianDashboard onLogout={handleLogout} token={token} />;
    }
    return <CitizenDashboard onLogout={handleLogout} token={token} />;
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 md:px-12 transition-all duration-300 ${scrollY > 50 ? 'bg-white/80 backdrop-blur-md border-b border-black/5 py-4 shadow-sm' : 'bg-transparent'}`}>
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative">
            <Shield className="w-8 h-8 text-black transition-transform group-hover:scale-110" />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-black blur-lg -z-10"
            />
          </div>
          <span className="text-xl font-display font-bold tracking-tighter text-black">hoWrk</span>
        </div>

        <div className="hidden md:flex items-center gap-12">
          {['Overview', 'Features', 'Shield', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-black/40 hover:text-black transition-colors uppercase tracking-widest"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          {!token && (
            <MagneticButton>
              <button
                onClick={() => setAuthView('login')}
                className="hidden md:block px-6 py-2 bg-black/5 text-black rounded-full text-sm font-bold hover:bg-black/10 transition-colors border border-black/10"
              >
                LOGIN
              </button>
            </MagneticButton>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-black hover:text-black/70 transition-colors"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={false}
        animate={isMenuOpen ? { x: 0 } : { x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center gap-8 md:hidden"
      >
        {['Overview', 'Features', 'Shield', 'Contact'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            onClick={() => {
              setIsMenuOpen(false);
              document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-4xl font-display font-bold hover:text-white transition-colors"
          >
            {item}
          </a>
        ))}
      </motion.div>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-white">
        <Hero3D scrollY={scrollY} />

        <div className="relative z-10 text-center px-6 max-w-5xl">
          {/* System Status Removed */}

          <h1 className="text-6xl md:text-[10vw] font-bold tracking-tighter leading-[0.85] mb-8 text-black">
            <TextReveal text="SECURE YOUR" className="justify-center" />
            <TextReveal text="URBAN FUTURE." className="justify-center" delay={0.2} />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg md:text-xl text-black/30 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            hoWrk is the world's first decentralized safety network,
            combining real-time sensor data with community intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <MagneticButton>
              <button
                onClick={() => setAuthView('login')}
                className="group flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform"
              >
                GET STARTED
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </MagneticButton>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-mono tracking-widest text-black/10 uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-black/20 to-transparent" />
        </motion.div>
      </section>

      {/* Stats / Features Grid */}
      <section id="overview" className="relative py-32 px-8 md:px-24 bg-white scroll-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: Globe, label: "Global Coverage", value: "142 Cities", desc: "Expanding rapidly across the globe." },
            { icon: Lock, label: "Encrypted Data", value: "Zero Trust", desc: "Your privacy is our primary directive." },
            { icon: Cpu, label: "AI Response", value: "< 2.4ms", desc: "Latency-free threat detection." }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-8 rounded-3xl bg-slate-dark border border-black/5 hover:border-black/20 transition-colors group"
            >
              <stat.icon className="w-10 h-10 text-black mb-6 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-mono text-black/20 uppercase tracking-widest mb-2">{stat.label}</div>
              <div className="text-4xl font-bold mb-4 text-black">{stat.value}</div>
              <p className="text-black/30">{stat.desc}</p>
            </motion.div>
          ))}
        </div>

      </section>

      {/* Horizontal Timeline Section */}
      <div id="features" className="scroll-mt-24">
        <HorizontalTimeline />
      </div>

      {/* CTA Section */}
      <section id="shield" className="relative py-48 px-8 md:px-24 overflow-hidden scroll-mt-24 bg-white">
        <div className="absolute inset-0 bg-radar-gradient opacity-10" />
        <div className="relative z-10 text-center">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 text-black">
            READY TO <span className="text-black/40">SHIELD</span> <br />
            YOUR COMMUNITY?
          </h2>
          <MagneticButton>
            <button className="px-12 py-6 bg-black text-white rounded-full font-bold text-2xl hover:scale-105 transition-transform">
              JOIN NETWORK
            </button>
          </MagneticButton>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-8 md:px-24 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-8 scroll-mt-24 bg-white text-black">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-black" />
          <span className="font-display font-bold tracking-tighter">hoWrk</span>
        </div>
        <div className="flex gap-8 text-sm text-black/40">
          <button onClick={() => setShowPrivacy(true)} className="hover:text-black transition-colors">Privacy Policy</button>
          <button onClick={() => setShowTerms(true)} className="hover:text-black transition-colors">Terms of Service</button>
          <a href="mailto:vrlogesh2006@gmail.com" className="hover:text-black transition-colors">Contact</a>
        </div>
        <div className="text-sm text-black/20 font-mono">
          © 2026 hoWrk INTELLIGENCE CORP.
        </div>
      </footer>

      {/* Progress Bar */}
      <motion.div
        style={{ scaleX: scaleProgress }}
        className="fixed bottom-0 left-0 right-0 h-1 bg-black origin-left z-50"
      />

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-black/10 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/5"
          >
            <button onClick={() => setShowPrivacy(false)} className="absolute top-6 right-6 p-2 text-black/40 hover:text-black transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold mb-6 text-black">Privacy Policy</h2>
            <div className="space-y-4 text-black/60 leading-relaxed">
              <p>At hoWrk, your privacy is our primary directive. We employ zero-trust architecture to ensure your data remains yours.</p>
              <h3 className="text-xl font-bold text-black mt-6">Data Collection</h3>
              <p>We collect only essential hyperlocal sensor data required for real-time threat detection. All data is end-to-end encrypted and anonymized.</p>
              <h3 className="text-xl font-bold text-black mt-6">Data Usage</h3>
              <p>Your data is used exclusively to power the hoWrk safety network. We never sell or share your personal information with third parties for marketing purposes.</p>
              <h3 className="text-xl font-bold text-black mt-6">Security</h3>
              <p>Our decentralized network ensures that there is no single point of failure. Your safety is protected by military-grade encryption.</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-black/10 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/5"
          >
            <button onClick={() => setShowTerms(false)} className="absolute top-6 right-6 p-2 text-black/40 hover:text-black transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold mb-6 text-black">Terms of Service</h2>
            <div className="space-y-4 text-black/60 leading-relaxed text-black">
              <p>By using hoWrk, you agree to join a community dedicated to collective urban safety.</p>
              <h3 className="text-xl font-bold text-black mt-6">User Responsibility</h3>
              <p>Users are expected to report incidents accurately. Malicious reporting or system abuse will result in immediate termination of access.</p>
              <h3 className="text-xl font-bold text-black mt-6">Network Participation</h3>
              <p>hoWrk is a decentralized network. While we strive for 100% accuracy, the system relies on community intelligence and sensor data.</p>
              <h3 className="text-xl font-bold text-black mt-6">Liability</h3>
              <p>hoWrk Intelligence Corp is not liable for any direct or indirect damages resulting from the use or inability to use the platform during emergencies.</p>
            </div>
          </motion.div>
        </div>
      )}
      <AnimatePresence>
        {isSentinelMode && (
          <SentinelUI onClose={() => setIsSentinelMode(false)} />
        )}
        {authView === 'login' && (
          <LoginPage
            onLoginSuccess={(token) => {
              setToken(token);
              localStorage.setItem('token', token);
              setAuthView('none');
            }}
            onSwitchToRegister={() => setAuthView('register')}
            onBack={() => setAuthView('none')}
          />
        )}
        {authView === 'register' && (
          <RegisterPage
            onRegisterSuccess={() => setAuthView('login')}
            onSwitchToLogin={() => setAuthView('login')}
            onBack={() => setAuthView('none')}
          />
        )}
      </AnimatePresence>

      <SOSWidget />
    </div>
  );
}
