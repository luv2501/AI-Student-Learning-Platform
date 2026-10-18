import { motion, useReducedMotion } from 'framer-motion';

/**
 * Restrained micro-interaction wrapper for panels, routes, and cards.
 * Adheres strictly to duration <= 150ms and honors prefers-reduced-motion.
 */
export default function MotionTransition({
  children,
  className = '',
  layoutId,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
