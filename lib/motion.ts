/** Preset animasi cepat — hindari delay panjang agar UI tidak terasa stuck */

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: easeOut },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.18, ease: easeOut },
};

export const slideFromLeft = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: easeOut },
};

export const slideFromRight = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: easeOut },
};

export const slideExitLeft = {
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.18, ease: easeOut },
};

export const slideExitRight = {
  exit: { opacity: 0, x: 12 },
  transition: { duration: 0.18, ease: easeOut },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
};

export const headerSlide = {
  initial: { opacity: 0, y: -8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOut },
  },
};
