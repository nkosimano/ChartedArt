/**
 * Framer Motion Animation Variants
 * ChartedArt Production v2, 2025
 */

import type { Variants } from 'framer-motion';

/**
 * Page transition variants - subtle snap-in effect
 */
export const pageTransition = {
  initial: { x: 12, scale: 0.97 },
  animate: { x: 0, scale: 1 },
  exit: { x: -12, scale: 0.97 },
  transition: { 
    duration: 0.25, 
    ease: [0.34, 1.56, 0.64, 1], // Snap-in easing
  },
};

/**
 * Button hover animation - snap effect
 */
export const buttonHover = {
  scale: 1.05,
  transition: { 
    type: 'spring',
    stiffness: 400,
    damping: 17,
  },
};

/**
 * Button tap/press animation
 */
export const buttonTap = {
  scale: 0.95,
};

/**
 * Gentle reveal animation with snap - replaces fade in
 */
export const gentleReveal: Variants = {
  initial: { y: 16, scale: 0.96 },
  animate: { y: 0, scale: 1 },
  exit: { y: -16, scale: 0.96 },
  transition: { 
    duration: 0.3,
    ease: [0.34, 1.56, 0.64, 1], // Snap-in easing
  },
};

/**
 * Slide up animation - no opacity
 */
export const slideUp: Variants = {
  initial: { y: 24 },
  animate: { y: 0 },
  exit: { y: -24 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

/**
 * Slide down animation - no opacity
 */
export const slideDown: Variants = {
  initial: { y: -24 },
  animate: { y: 0 },
  exit: { y: 24 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

/**
 * Scale animation - subtle zoom only
 */
export const scale: Variants = {
  initial: { scale: 0.96 },
  animate: { scale: 1 },
  exit: { scale: 0.96 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
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
 * Gallery tile animation (hover) - snap effect
 */
export const galleryTileHover = {
  scale: 1.05,
  y: -4,
  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.15)',
  transition: { 
    type: 'spring',
    stiffness: 300,
    damping: 15,
  },
};

/**
 * Gallery tile animation (tap)
 */
export const galleryTileTap = {
  scale: 0.98,
};

/**
 * Card hover animation - snap lift effect
 */
export const cardHover = {
  y: -6,
  scale: 1.02,
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  transition: { 
    type: 'spring',
    stiffness: 350,
    damping: 16,
  },
};

/**
 * Modal/Dialog animation - snap-in pop effect
 */
export const modal: Variants = {
  initial: { scale: 0.92, y: 20 },
  animate: { scale: 1, y: 0 },
  exit: { scale: 0.92, y: 20 },
  transition: { 
    type: 'spring',
    stiffness: 300,
    damping: 20,
  },
};

/**
 * Modal backdrop - only backdrop uses opacity
 */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

/**
 * Accordion/FAQ animation - height only for smooth expansion
 */
export const accordion: Variants = {
  collapsed: { height: 0 },
  expanded: { height: 'auto' },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

/**
 * Chevron rotation for accordion
 */
export const chevronRotate: Variants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
};

/**
 * Toast notification animation - snap-in from edge
 */
export const toast: Variants = {
  initial: { y: -100, x: '-50%', scale: 0.95 },
  animate: { y: 0, x: '-50%', scale: 1 },
  exit: { y: -100, x: '-50%', scale: 0.95 },
  transition: { 
    type: 'spring',
    stiffness: 350,
    damping: 22,
  },
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
 * List item stagger animation - subtle slide
 */
export const listItem: Variants = {
  initial: { x: -16, scale: 0.97 },
  animate: { x: 0, scale: 1 },
  exit: { x: 16, scale: 0.97 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
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
