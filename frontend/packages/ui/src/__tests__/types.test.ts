/**
 * Type tests for nself-chat UI package
 *
 * TypeScript compilation tests to ensure types are correct
 */

import type {
  ThemeColors,
  ThemePreset,
  ColorScheme,
  ThemeConfig,
  BaseComponentProps,
  AsChildProps,
  AnimatedProps,
  LoadingProps,
  DisabledProps,
  Size,
  Variant,
} from '../types'

describe('Types', () => {
  describe('Theme Types', () => {
    it('ThemeColors has all required properties', () => {
      const colors: ThemeColors = {
        primaryColor: '#000',
        secondaryColor: '#111',
        accentColor: '#222',
        backgroundColor: '#fff',
        surfaceColor: '#eee',
        textColor: '#000',
        mutedColor: '#999',
        borderColor: '#ddd',
        buttonPrimaryBg: '#000',
        buttonPrimaryText: '#fff',
        buttonSecondaryBg: '#eee',
        buttonSecondaryText: '#000',
        successColor: '#0f0',
        warningColor: '#ff0',
        errorColor: '#f00',
        infoColor: '#00f',
      }
      expect(colors).toBeDefined()
    })

    it('ThemePreset structure is valid', () => {
      const preset: ThemePreset = {
        name: 'Test Theme',
        preset: 'test',
        light: {
          primaryColor: '#000',
          secondaryColor: '#111',
          accentColor: '#222',
          backgroundColor: '#fff',
          surfaceColor: '#eee',
          textColor: '#000',
          mutedColor: '#999',
          borderColor: '#ddd',
          buttonPrimaryBg: '#000',
          buttonPrimaryText: '#fff',
          buttonSecondaryBg: '#eee',
          buttonSecondaryText: '#000',
          successColor: '#0f0',
          warningColor: '#ff0',
          errorColor: '#f00',
          infoColor: '#00f',
        },
        dark: {
          primaryColor: '#fff',
          secondaryColor: '#eee',
          accentColor: '#ddd',
          backgroundColor: '#000',
          surfaceColor: '#111',
          textColor: '#fff',
          mutedColor: '#666',
          borderColor: '#333',
          buttonPrimaryBg: '#fff',
          buttonPrimaryText: '#000',
          buttonSecondaryBg: '#222',
          buttonSecondaryText: '#fff',
          successColor: '#0f0',
          warningColor: '#ff0',
          errorColor: '#f00',
          infoColor: '#00f',
        },
      }
      expect(preset).toBeDefined()
    })

    it('ColorScheme accepts valid values', () => {
      const light: ColorScheme = 'light'
      const dark: ColorScheme = 'dark'
      const system: ColorScheme = 'system'

      expect(light).toBe('light')
      expect(dark).toBe('dark')
      expect(system).toBe('system')
    })

    it('ThemeConfig structure is valid', () => {
      const config: ThemeConfig = {
        preset: 'nself',
        colorScheme: 'dark',
        customColors: {
          primaryColor: '#00D4FF',
        },
      }
      expect(config).toBeDefined()
    })
  })

  describe('Component Types', () => {
    it('BaseComponentProps structure is valid', () => {
      const props: BaseComponentProps = {
        className: 'test-class',
        'data-testid': 'test-id',
      }
      expect(props).toBeDefined()
    })

    it('Size accepts valid values', () => {
      const sm: Size = 'sm'
      const def: Size = 'default'
      const lg: Size = 'lg'

      expect(sm).toBe('sm')
      expect(def).toBe('default')
      expect(lg).toBe('lg')
    })

    it('Variant accepts valid values', () => {
      const variants: Variant[] = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']
      variants.forEach((variant) => {
        expect(variant).toBeDefined()
      })
    })

    it('Component prop interfaces combine correctly', () => {
      type CombinedProps = BaseComponentProps & AsChildProps & AnimatedProps & LoadingProps & DisabledProps

      const props: CombinedProps = {
        className: 'test',
        asChild: false,
        animated: true,
        loading: false,
        disabled: false,
      }
      expect(props).toBeDefined()
    })
  })
})
