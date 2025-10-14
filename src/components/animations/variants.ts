/**
 * Framer Motion Animation Variants
 * ChartedArt Production v2, 2025
 */

import type { Variants } from 'framer-motion';

/**
 * Page transition variants
 */
export const pageTransition = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
  transition: { duration: 0.5, ease: 'easeInOut' },
};

/**
 * Button hover animation
 */
export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2, ease: 'easeOut' },
};

/**
 * Button tap/press animation
 */
export const buttonTap = {
  scale: 0.95,
};

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slide up animation
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};

/**
 * Slide down animation
 */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

/**
 * Scale animation
 */
export const scale: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/**
 * Stagger children animation
 */
export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Gallery tile animation (hover)
 */
export const galleryTileHover = {
  scale: 1.05,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * Gallery tile animation (tap)
 */
export const galleryTileTap = {
  scale: 0.98,
};

/**
 * Card hover animation
 */
export const cardHover = {
  y: -5,
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * Modal/Dialog animation
 */
export const modal: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

/**
 * Accordion/FAQ animation
 */
export const accordion: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1 },
};

/**
 * Chevron rotation for accordion
 */
export const chevronRotate: Variants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
};

/**
 * Toast notification animation
 */
export const toast: Variants = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

/**
 * Loading spinner animation
 */
export const spinner = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Pulse animation (for badges, notifications)
 */
export const pulse: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Bounce animation
 */
export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Form status animations
 */
export const formStatus = {
  idle: {},
  loading: {
    opacity: 0.7,
  },
  success: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  },
  error: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

/**
 * List item stagger animation
 */
export const listItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Container for staggered list items
 */
export const listContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};
