import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Shield, MapPin, Zap, Bell, Eye, Navigation } from 'lucide-react';

const steps = [
  {
    title: "Report Incident",
    description: "Instant AI-powered reporting with hyperlocal precision. Our neural network identifies threats before they escalate.",
    icon: Bell,
    color: "text-black",
    bg: "bg-black/5",
    border: "border-black/10"
  },
  {
    title: "Trigger SOS",
    description: "One-tap emergency response. Connects you to the nearest first responders and emergency contacts in milliseconds.",
    icon: Zap,
    color: "text-black",
    bg: "bg-black/5",
    border: "border-black/10"
  },
  {
    title: "Safe Walk",
    description: "Real-time companion tracking. Our predictive algorithms monitor your route and alert authorities if you deviate.",
    icon: Navigation,
    color: "text-black",
    bg: "bg-black/5",
    border: "border-black/10"
  },
  {
    title: "Community Watch",
    description: "Crowdsourced intelligence for collective safety. Stay informed with live updates from verified neighbors.",
    icon: Eye,
    color: "text-black",
    bg: "bg-black/5",
    border: "border-black/10"
  }
];

export const HorizontalTimeline = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-12 px-12 md:px-24">
          <div className="flex flex-col justify-center min-w-[40vw]">
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-6 text-black">
              THE <span className="text-black/20">hoWrk</span> <br />
              IN ACTION.
            </h2>
            <p className="text-xl text-black/30 max-w-md">
              Experience the seamless integration of technology and safety as we redefine urban protection.
            </p>
          </div>

          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative flex flex-col justify-between p-12 min-w-[80vw] md:min-w-[35vw] h-[60vh] bg-slate-dark border border-black/5 rounded-3xl overflow-hidden transition-all hover:border-black/10"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 ${step.bg} blur-[100px] -mr-32 -mt-32 opacity-20 group-hover:opacity-40 transition-opacity`} />

              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center mb-8`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h3 className="text-4xl font-bold mb-4 text-black">{step.title}</h3>
                <p className="text-lg text-black/40 leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-4">
                <span className="text-xs font-mono tracking-widest text-black/30 uppercase">Step 0{i + 1}</span>
                <div className="h-[1px] flex-1 bg-black/10" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
