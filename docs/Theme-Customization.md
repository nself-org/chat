# Theme Customization

Complete theme customization system for nself-chat with color pickers, typography controls, preset themes, and import/export functionality.

## Features

### Color Customization
- **16 customizable colors** organized by category:
  - **Brand**: Primary, Secondary, Accent
  - **Surfaces**: Background, Surface, Border
  - **Text**: Text, Muted
  - **Buttons**: Primary/Secondary Background and Text
  - **Status**: Success, Warning, Error, Info
- Visual color picker with preset swatches
- Custom hex color input
- Native color picker support
- Live preview of changes

### Typography
- **Font Family Selection**
  - 17 pre-configured fonts
  - Categorized by Sans-serif, Serif, Monospace
  - Live preview with sample text
- **Font Size Scale**
  - Range: 75% to 150%
  - Visual slider with labels
  - Real-time preview

### Spacing & Layout
- **Border Radius**
  - 7 preset options (None to Full)
  - Visual preview buttons
- **Spacing Scale**
  - Range: 75% to 150%
  - Affects padding and gaps
  - Live preview

### Theme Presets
- **25+ built-in presets**
  - nself (Default)
  - Slack, Discord
  - Ocean, Sunset, Midnight
  - All Tailwind colors
- Each preset has **light AND dark variants**
- Visual thumbnail previews
- One-click application

### Advanced Features
- **Custom CSS Injection**
  - Code editor for custom styles
  - Syntax highlighting
  - Override any theme property
- **Import/Export**
  - Export theme as JSON file
  - Copy JSON to clipboard
  - Import from JSON
  - Generate shareable URL
- **Live Preview**
  - Real-time color updates
  - Preview buttons, surfaces, status colors
  - Toggle preview panel

## File Structure

```
src/
├── components/settings/
│   └── ThemeCustomizer.tsx          # Main UI component
├── hooks/
│   └── use-theme-customizer.ts      # Theme customization logic
├── lib/theme/
│   └── custom-theme.ts              # Theme utilities and types
├── contexts/
│   └── theme-context.tsx            # Enhanced theme context
└── lib/
    └── theme-presets.ts             # 25+ theme presets
```

## Usage

### Basic Usage

```tsx
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer'

export default function ThemeSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <ThemeCustomizer />
    </div>
  )
}
```

### Using the Hook

```tsx
import { useThemeCustomizer } from '@/hooks/use-theme-customizer'

function MyComponent() {
  const {
    theme,
    isModified,
    updateColor,
    loadPreset,
    saveTheme,
    exportJSON,
  } = useThemeCustomizer()

  // Update a single color
  const handleColorChange = (color: string) => {
    updateColor('primaryColor', color)
  }

  // Load a preset
  const handlePresetLoad = () => {
    loadPreset('slack', 'dark')
  }

  // Save theme
  const handleSave = async () => {
    await saveTheme()
  }

  // Export as JSON
  const handleExport = () => {
    const json = exportJSON()
    console.log(json)
  }

  return (
    <div>
      {isModified && <p>You have unsaved changes</p>}
      <button onClick={handleSave}>Save Theme</button>
      <button onClick={handleExport}>Export</button>
    </div>
  )
}
```

### Programmatic Theme Application

```tsx
import { applyCustomTheme, createThemeFromPreset } from '@/lib/theme/custom-theme'

// Create theme from preset
const theme = createThemeFromPreset('ocean', 'dark')

// Apply to document
applyCustomTheme(theme)
```

### Import/Export

```tsx
import {
  exportThemeJSON,
  importThemeJSON,
  generateThemeShareURL,
} from '@/lib/theme/custom-theme'

// Export
const json = exportThemeJSON(theme)
// Save to file or copy to clipboard

// Import
try {
  const imported = importThemeJSON(jsonString)
  applyCustomTheme(imported)
} catch (error) {
  console.error('Invalid theme JSON')
}

// Generate share URL
const url = generateThemeShareURL(theme)
// https://example.com/theme/eyJjb2xvcnMiOns...
```

## API Reference

### Hook: `useThemeCustomizer()`

Returns an object with:

#### State
- `theme: CustomThemeConfig` - Current theme configuration
- `isModified: boolean` - Whether theme has unsaved changes
- `isLoading: boolean` - Whether theme is loading

#### Color Actions
- `updateColor(key, value)` - Update a single color
- `updateColors(colors)` - Update multiple colors at once
- `resetColor(key)` - Reset a color to original
- `resetAllColors()` - Reset all colors to original

#### Typography Actions
- `setFontFamily(font)` - Set font family
- `setFontScale(scale)` - Set font size scale (0.75-1.5)

#### Spacing Actions
- `setBorderRadius(radius)` - Set border radius
- `setSpacingScale(scale)` - Set spacing scale (0.75-1.5)

#### Color Scheme
- `setColorScheme(scheme)` - Set 'light', 'dark', or 'system'

#### Custom CSS
- `setCustomCSS(css)` - Set custom CSS string

#### Preset Actions
- `loadPreset(key, colorScheme?)` - Load a theme preset
- `resetToPreset()` - Reset to last saved preset

#### Save/Load Actions
- `saveTheme()` - Save to AppConfig and localStorage
- `loadTheme()` - Load from localStorage
- `resetTheme()` - Reset to default theme

#### Import/Export
- `exportJSON()` - Export theme as JSON string
- `importJSON(json)` - Import theme from JSON string
- `generateShareURL()` - Generate shareable URL
- `downloadJSON()` - Download theme as JSON file
- `copyJSON()` - Copy JSON to clipboard

### Type: `CustomThemeConfig`

```typescript
interface CustomThemeConfig {
  // Core theme colors
  colors: ThemeColors

  // Typography
  fontFamily: string
  fontScale: number // 0.75 to 1.5

  // Spacing
  borderRadius: string
  spacingScale: number // 0.75 to 1.5

  // Custom CSS
  customCSS?: string

  // Color scheme
  colorScheme: 'light' | 'dark' | 'system'

  // Preset info
  preset?: string
  presetName?: string
}
```

### Type: `ThemeColors`

```typescript
interface ThemeColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string
  borderColor: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string
}
```

## Examples

### Custom Brand Colors

```tsx
const { updateColors, saveTheme } = useThemeCustomizer()

// Apply brand colors
updateColors({
  primaryColor: '#FF6B00',    // Brand orange
  secondaryColor: '#00B4D8',  // Brand blue
  accentColor: '#FFD60A',     // Brand yellow
})

// Save to persist
await saveTheme()
```

### Create Custom Theme from Scratch

```tsx
import { CustomThemeConfig } from '@/lib/theme/custom-theme'

const myTheme: CustomThemeConfig = {
  colors: {
    primaryColor: '#FF6B00',
    secondaryColor: '#00B4D8',
    accentColor: '#FFD60A',
    backgroundColor: '#0F0F0F',
    surfaceColor: '#1A1A1A',
    textColor: '#FFFFFF',
    mutedColor: '#888888',
    borderColor: '#333333',
    buttonPrimaryBg: '#FF6B00',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: '#333333',
    buttonSecondaryText: '#FFFFFF',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
    infoColor: '#3B82F6',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  fontScale: 1.0,
  borderRadius: '8px',
  spacingScale: 1.0,
  colorScheme: 'dark',
  customCSS: `
    .my-custom-button {
      background: linear-gradient(to right, #FF6B00, #FFD60A);
    }
  `,
}

// Apply it
applyCustomTheme(myTheme)
```

### Export Theme for Team

```tsx
const { exportJSON, generateShareURL } = useThemeCustomizer()

// Export as JSON file
const json = exportJSON()
// Send to team members

// Or generate share link
const url = generateShareURL()
// Share URL: https://example.com/theme/eyJjb2xvcnMi...
```

### Import Team Theme

```tsx
const { importJSON } = useThemeCustomizer()

// Receive JSON from team
const teamThemeJSON = '{"colors": {...}, ...}'

// Import it
try {
  importJSON(teamThemeJSON)
} catch (error) {
  alert('Invalid theme JSON')
}
```

## Integration with AppConfig

The theme customizer integrates seamlessly with the existing AppConfig system:

```tsx
import { useAppConfig } from '@/contexts/app-config-context'

const { config, updateConfig } = useAppConfig()

// Theme is stored in config.theme
console.log(config.theme.primaryColor)
console.log(config.theme.fontFamily)
console.log(config.theme.borderRadius)

// Updates automatically save to both localStorage and database
```

## CSS Variables

Theme colors are applied as CSS variables:

```css
/* Available CSS variables */
--color-primary
--color-secondary
--color-accent
--color-background
--color-surface
--color-text
--color-muted
--color-border
--color-button-primary-bg
--color-button-primary-text
--color-button-secondary-bg
--color-button-secondary-text
--color-success
--color-warning
--color-error
--color-info

/* Typography */
--font-family
--font-scale

/* Spacing */
--border-radius
--spacing-scale
```

Use in your components:

```css
.my-component {
  color: var(--color-primary);
  background: var(--color-surface);
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}
```

## Custom CSS Injection

Add custom CSS to override or extend the theme:

```tsx
const { setCustomCSS } = useThemeCustomizer()

setCustomCSS(`
  /* Custom gradients */
  .gradient-primary {
    background: linear-gradient(
      to right,
      var(--color-primary),
      var(--color-secondary)
    );
  }

  /* Custom animations */
  @keyframes pulse-primary {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .pulse {
    animation: pulse-primary 2s infinite;
  }

  /* Custom button styles */
  .btn-custom {
    background: var(--color-accent);
    border-radius: calc(var(--border-radius) * 2);
    padding: calc(1rem * var(--spacing-scale));
  }
`)
```

## Best Practices

### 1. Maintain Contrast
Always ensure sufficient contrast between text and background colors for accessibility.

```tsx
import { isLightColor, getContrastingTextColor } from '@/lib/theme/custom-theme'

const bgColor = '#FF6B00'
const textColor = getContrastingTextColor(bgColor)
// Returns '#000000' or '#FFFFFF' based on luminance
```

### 2. Test Both Light and Dark Modes
If using 'system' color scheme, test your custom colors in both modes.

### 3. Export Your Theme
Always export your custom theme as a backup:

```tsx
const { downloadJSON } = useThemeCustomizer()
downloadJSON() // Downloads theme-custom-1706800000000.json
```

### 4. Use Presets as Starting Points
Start with a preset close to your brand, then customize:

```tsx
loadPreset('ocean', 'dark')  // Start with ocean theme
updateColor('primaryColor', '#FF6B00')  // Customize primary color
```

### 5. Preview Before Saving
Use the live preview to see changes before committing:

```tsx
// Make changes...
updateColor('primaryColor', '#FF6B00')
// Preview looks good?
await saveTheme()
```

## Troubleshooting

### Theme Not Applying
If theme changes don't appear:

1. Check if custom CSS has syntax errors
2. Verify colors are valid hex format (#RRGGBB)
3. Clear localStorage and reload: `localStorage.removeItem('custom-theme')`

### Import Fails
If importing a theme fails:

1. Validate JSON format
2. Ensure all required color properties exist
3. Check console for specific error message

### Colors Look Wrong
If colors appear incorrect:

1. Check browser developer tools for CSS variable values
2. Verify no conflicting custom CSS
3. Test in incognito mode to rule out browser extensions

## Migration from Old Theme System

If you have existing theme configurations:

```tsx
// Old system
const oldTheme = {
  primaryColor: '#FF6B00',
  // ... other colors
}

// Convert to new system
const { updateColors } = useThemeCustomizer()
updateColors(oldTheme)
await saveTheme()
```

## Performance

- Theme changes apply instantly via CSS variables
- No page reload required
- Changes persist across sessions via localStorage
- Syncs with database asynchronously

## Accessibility

- All color pickers are keyboard accessible
- ARIA labels provided for screen readers
- Contrast warnings for accessibility issues
- Focus indicators on all interactive elements

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS variables support required
- localStorage support required
- ES6+ features used
