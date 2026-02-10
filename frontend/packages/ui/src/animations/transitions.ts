/**
 * Framer Motion transition configurations
 *
 * Extracted for reuse across animation variants
 */

import { Transition } from 'framer-motion'

export const spring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
}

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 20,
}

export const easeOut: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
}

export const easeInOut: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
}

export const easeFast: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.15,
}

export const easeSlow: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.5,
}
