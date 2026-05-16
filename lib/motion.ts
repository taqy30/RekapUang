/** Preset animasi — auth santai, dashboard & loading responsif */

export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeSmooth = [0.25, 0.46, 0.45, 0.94] as const;

/* Auth: santai */
export const fadeUpRelaxed = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: easeSmooth },
};

export const slideFromLeftRelaxed = {
  initial: { opacity: 0, x: -36 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.75, ease: easeSmooth },
};

export const slideFromRightRelaxed = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.75, ease: easeSmooth },
};

export const slideExitLeftRelaxed = {
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.45, ease: easeSmooth },
};

export const slideExitRightRelaxed = {
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.45, ease: easeSmooth },
};

/* Dashboard */
export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
};

export const headerSlide = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

/* Loading dashboard */
export const loadingScreen = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: easeOut },
};

export const loadingPulse = {
  animate: {
    scale: [1, 1.06, 1],
    opacity: [0.85, 1, 0.85],
  },
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export const loadingBar = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1 },
  transition: { duration: 1.2, ease: easeSmooth },
};

export const loadingStagger = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const loadingSkeleton = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: easeOut },
};
