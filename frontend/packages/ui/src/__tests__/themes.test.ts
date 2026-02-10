/**
 * Theme tests for nself-chat UI package
 */

import { themePresets } from '../themes/presets'
import { colorTokens, cssVariables } from '../themes/colors'
import { fontSizes, fontWeights } from '../themes/typography'
import { spacing, borderRadii } from '../themes/spacing'
import { shadows } from '../themes/shadows'

describe('Theme System', () => {
  describe('Theme Presets', () => {
    it('exports theme presets object', () => {
      expect(themePresets).toBeDefined()
      expect(typeof themePresets).toBe('object')
    })

    it('includes nself default theme', () => {
      expect(themePresets.nself).toBeDefined()
      expect(themePresets.nself.name).toBe('nself (Default)')
      expect(themePresets.nself.preset).toBe('nself')
    })

    it('includes slack theme', () => {
      expect(themePresets.slack).toBeDefined()
      expect(themePresets.slack.name).toBe('Slack')
    })

    it('includes discord theme', () => {
      expect(themePresets.discord).toBeDefined()
      expect(themePresets.discord.name).toBe('Discord')
    })

    it('has light and dark variants for each theme', () => {
      Object.values(themePresets).forEach((preset) => {
        expect(preset.light).toBeDefined()
        expect(preset.dark).toBeDefined()
      })
    })

    it('has all required color properties', () => {
      const requiredProps = [
        'primaryColor',
        'secondaryColor',
        'accentColor',
        'backgroundColor',
        'surfaceColor',
        'textColor',
        'mutedColor',
        'borderColor',
        'buttonPrimaryBg',
        'buttonPrimaryText',
        'buttonSecondaryBg',
        'buttonSecondaryText',
        'successColor',
        'warningColor',
        'errorColor',
        'infoColor',
      ]

      Object.values(themePresets).forEach((preset) => {
        requiredProps.forEach((prop) => {
          expect(preset.light).toHaveProperty(prop)
          expect(preset.dark).toHaveProperty(prop)
        })
      })
    })

    it('has at least 25 theme presets', () => {
      const presetCount = Object.keys(themePresets).length
      expect(presetCount).toBeGreaterThanOrEqual(25)
    })
  })

  describe('Color Tokens', () => {
    it('exports color tokens', () => {
      expect(colorTokens).toBeDefined()
      expect(typeof colorTokens).toBe('object')
    })

    it('includes primary colors', () => {
      expect(colorTokens.primary).toBe('var(--primary)')
      expect(colorTokens['primary-foreground']).toBe('var(--primary-foreground)')
    })

    it('includes status colors', () => {
      expect(colorTokens.destructive).toBe('var(--destructive)')
      expect(colorTokens.success).toBe('var(--success)')
      expect(colorTokens.warning).toBe('var(--warning)')
      expect(colorTokens.info).toBe('var(--info)')
    })

    it('exports CSS variables array', () => {
      expect(cssVariables).toBeDefined()
      expect(Array.isArray(cssVariables)).toBe(true)
      expect(cssVariables.length).toBeGreaterThan(20)
    })
  })

  describe('Typography', () => {
    it('exports font sizes', () => {
      expect(fontSizes).toBeDefined()
      expect(fontSizes.base).toBe('1rem')
      expect(fontSizes.lg).toBe('1.125rem')
    })

    it('exports font weights', () => {
      expect(fontWeights).toBeDefined()
      expect(fontWeights.normal).toBe('400')
      expect(fontWeights.bold).toBe('700')
    })

    it('has complete font size scale', () => {
      const expectedSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']
      expectedSizes.forEach((size) => {
        expect(fontSizes).toHaveProperty(size)
      })
    })
  })

  describe('Spacing', () => {
    it('exports spacing scale', () => {
      expect(spacing).toBeDefined()
      expect(spacing[0]).toBe('0px')
      expect(spacing[4]).toBe('1rem')
      expect(spacing[8]).toBe('2rem')
    })

    it('exports border radii', () => {
      expect(borderRadii).toBeDefined()
      expect(borderRadii.none).toBe('0px')
      expect(borderRadii.full).toBe('9999px')
    })

    it('uses 4px base unit', () => {
      expect(spacing[1]).toBe('0.25rem') // 4px
      expect(spacing[2]).toBe('0.5rem') // 8px
      expect(spacing[4]).toBe('1rem') // 16px
    })
  })

  describe('Shadows', () => {
    it('exports shadow scale', () => {
      expect(shadows).toBeDefined()
      expect(shadows.none).toBe('none')
      expect(shadows.sm).toBeDefined()
      expect(shadows.lg).toBeDefined()
    })

    it('has complete shadow scale', () => {
      const expectedShadows = ['none', 'sm', 'default', 'md', 'lg', 'xl', '2xl']
      expectedShadows.forEach((shadow) => {
        expect(shadows).toHaveProperty(shadow)
      })
    })
  })
})
