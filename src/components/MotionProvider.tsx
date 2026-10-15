import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/** LazyMotion keeps the framer-motion bundle small; MotionConfig honours prefers-reduced-motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
