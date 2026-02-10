/**
 * Animation tests for nself-chat UI package
 */

import {
  spring,
  springSmooth,
  springBouncy,
  easeOut,
  easeInOut,
  buttonPress,
  modalOverlay,
  modalContent,
  toastSlide,
  errorShake,
  successCheckmark,
  fade,
  slide,
  scale,
} from '../animations'

describe('Animations', () => {
  describe('Transitions', () => {
    it('exports spring transitions', () => {
      expect(spring).toBeDefined()
      expect(spring.type).toBe('spring')
      expect(spring.stiffness).toBe(400)
      expect(spring.damping).toBe(30)
    })

    it('exports smooth spring transition', () => {
      expect(springSmooth).toBeDefined()
      expect(springSmooth.type).toBe('spring')
      expect(springSmooth.stiffness).toBe(300)
    })

    it('exports bouncy spring transition', () => {
      expect(springBouncy).toBeDefined()
      expect(springBouncy.type).toBe('spring')
      expect(springBouncy.stiffness).toBe(500)
    })

    it('exports ease transitions', () => {
      expect(easeOut).toBeDefined()
      expect(easeOut.type).toBe('tween')
      expect(easeOut.ease).toBe('easeOut')

      expect(easeInOut).toBeDefined()
      expect(easeInOut.type).toBe('tween')
      expect(easeInOut.ease).toBe('easeInOut')
    })
  })

  describe('Component Animations', () => {
    it('exports button press animation', () => {
      expect(buttonPress).toBeDefined()
      expect(buttonPress.rest).toBeDefined()
      expect(buttonPress.hover).toBeDefined()
      expect(buttonPress.tap).toBeDefined()
    })

    it('exports modal animations', () => {
      expect(modalOverlay).toBeDefined()
      expect(modalOverlay.initial).toBeDefined()
      expect(modalOverlay.animate).toBeDefined()
      expect(modalOverlay.exit).toBeDefined()

      expect(modalContent).toBeDefined()
      expect(modalContent.initial).toBeDefined()
      expect(modalContent.animate).toBeDefined()
      expect(modalContent.exit).toBeDefined()
    })

    it('exports toast animation', () => {
      expect(toastSlide).toBeDefined()
      expect(toastSlide.initial).toBeDefined()
      expect(toastSlide.animate).toBeDefined()
      expect(toastSlide.exit).toBeDefined()
    })

    it('exports form animations', () => {
      expect(errorShake).toBeDefined()
      expect(errorShake.animate).toBeDefined()

      expect(successCheckmark).toBeDefined()
      expect(successCheckmark.initial).toBeDefined()
      expect(successCheckmark.animate).toBeDefined()
    })
  })

  describe('Animation Utilities', () => {
    it('creates fade variants', () => {
      const fadeVariant = fade(0.3)
      expect(fadeVariant.initial).toEqual({ opacity: 0 })
      expect(fadeVariant.animate).toBeDefined()
      expect(fadeVariant.exit).toBeDefined()
    })

    it('creates slide variants', () => {
      const slideUp = slide('up', 20)
      expect(slideUp.initial).toBeDefined()
      expect(slideUp.animate).toBeDefined()
      expect(slideUp.exit).toBeDefined()

      const slideRight = slide('right', 30)
      expect(slideRight.initial).toBeDefined()
      expect(slideRight.animate).toBeDefined()
    })

    it('creates scale variants', () => {
      const scaleVariant = scale(0.8, 1)
      expect(scaleVariant.initial).toEqual({ scale: 0.8, opacity: 0 })
      expect(scaleVariant.animate).toEqual({ scale: 1, opacity: 1, transition: spring })
      expect(scaleVariant.exit).toBeDefined()
    })
  })

  describe('Animation State Management', () => {
    it('button press has correct states', () => {
      expect(buttonPress.rest.scale).toBe(1)
      expect(buttonPress.hover.scale).toBe(1.02)
      expect(buttonPress.tap.scale).toBe(0.98)
    })

    it('modal overlay fades correctly', () => {
      expect(modalOverlay.initial.opacity).toBe(0)
      expect(modalOverlay.animate.opacity).toBe(1)
      expect(modalOverlay.exit.opacity).toBe(0)
    })

    it('error shake has correct animation', () => {
      expect(errorShake.animate.x).toEqual([0, -10, 10, -10, 10, 0])
      expect(errorShake.animate.transition.duration).toBe(0.4)
    })
  })
})
