import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const TextReveal = ({ text, className = "", delay = 0, as: Component = 'div' }: TextRevealProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const words = text.split(" ");

  return (
    <Component ref={ref} className={`overflow-hidden flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="relative overflow-hidden mr-[0.25em] mb-[0.1em]">
          <motion.span
            initial={{ y: "100%" }}
            animate={inView ? { y: 0 } : { y: "100%" }}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.05,
              ease: [0.215, 0.61, 0.355, 1],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
};
