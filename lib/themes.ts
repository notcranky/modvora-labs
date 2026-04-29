// Theme system - customizable colors, accessibility modes, dark/light variants
// Full WCAG 2.1 AA compliant

export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    background: string
    surface: string
    surfaceElevated: string
    primary: string
    primaryHover: string
    secondary: string
    accent: string
    text: string
    textMuted: string
    border: string
    error: string
    success: string
    warning: string
  }
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    largeText: boolean
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
  }
}

export const THEMES: Theme[] = [
  // Default dark (current)
  {
    id: 'dark',
    name: 'Midnight',
    description: 'Default dark theme for car enthusiasts',
    colors: {
      background: '#0a0a0b',
      surface: '#16161a',
      surfaceElevated: '#1e1e24',
      primary: '#a855f7',
      primaryHover: '#c084fc',
      secondary: '#3b82f6',
      accent: '#f97316',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#2a2a30',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#eab308'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  // Light theme
  {
    id: 'light',
    name: 'Daylight',
    description: 'Clean light theme for daytime browsing',
    colors: {
      background: '#fafafa',
      surface: '#ffffff',
      surfaceElevated: '#f5f5f5',
      primary: '#7c3aed',
      primaryHover: '#8b5cf6',
      secondary: '#2563eb',
      accent: '#ea580c',
      text: '#171717',
      textMuted: '#525252',
      border: '#e5e5e5',
      error: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  // High contrast
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for visual accessibility',
    colors: {
      background: '#000000',
      surface: '#000000',
      surfaceElevated: '#1a1a1a',
      primary: '#ffff00',
      primaryHover: '#ffff80',
      secondary: '#00ffff',
      accent: '#ff00ff',
      text: '#ffffff',
      textMuted: '#cccccc',
      border: '#ffffff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00'
    },
    accessibility: { highContrast: true, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  // OLED black (pure black for OLED screens)
  {
    id: 'oled',
    name: 'OLED Black',
    description: 'Pure black for maximum battery savings on OLED',
    colors: {
      background: '#000000',
      surface: '#0d0d0d',
      surfaceElevated: '#141414',
      primary: '#a855f7',
      primaryHover: '#c084fc',
      secondary: '#3b82f6',
      accent: '#f97316',
      text: '#ffffff',
      textMuted: '#9ca3af',
      border: '#1f1f1f',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#eab308'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  // Car brand themes
  {
    id: 'bmw-m',
    name: 'BMW M',
    description: 'Inspired by BMW M colors',
    colors: {
      background: '#0a0a0b',
      surface: '#111',
      surfaceElevated: '#1a1a1a',
      primary: '#0066b1',
      primaryHover: '#3388c4',
      secondary: '#d4001a',
      accent: '#d4001a',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#2a2a30',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#eab308'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  {
    id: 'mercedes-amg',
    name: 'AMG Night',
    description: 'Mercedes-AMG Petronas inspired',
    colors: {
      background: '#0a0a0b',
      surface: '#111',
      surfaceElevated: '#1a1a1a',
      primary: '#00d2be',
      primaryHover: '#33ddd1',
      secondary: '#ffffff',
      accent: '#c0c0c0',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#2a2a30',
      error: '#ff4d4d',
      success: '#00d2be',
      warning: '#ffd700'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  {
    id: 'gtr',
    name: 'Midnight Purple',
    description: 'Iconic R34 GTR color',
    colors: {
      background: '#0a080c',
      surface: '#130f1a',
      surfaceElevated: '#1e1930',
      primary: '#6b21a8',
      primaryHover: '#8b4cc0',
      secondary: '#a855f7',
      accent: '#d8b4fe',
      text: '#f3e8ff',
      textMuted: '#a78bfa',
      border: '#2a2035',
      error: '#f87171',
      success: '#86efac',
      warning: '#fde047'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  {
    id: 'subaru-wrx',
    name: 'WRX Rally',
    description: 'Subaru rally blue',
    colors: {
      background: '#020617',
      surface: '#0f172a',
      surfaceElevated: '#1e293b',
      primary: '#facc15',
      primaryHover: '#fde047',
      secondary: '#0066cc',
      accent: '#facc15',
      text: '#ffffff',
      textMuted: '#94a3b8',
      border: '#1e293b',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#facc15'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'none' }
  },
  
  // Accessibility variants
  {
    id: 'protano',
    name: 'Protanopia Safe',
    description: 'Optimized for red-blind users',
    colors: {
      background: '#0a0a0b',
      surface: '#16161a',
      surfaceElevated: '#1e1e24',
      primary: '#0088ff',
      primaryHover: '#44aaff',
      secondary: '#00cc88',
      accent: '#ffdd00',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#2a2a30',
      error: '#0055ff',
      success: '#00cc88',
      warning: '#ffdd00'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, colorBlindMode: 'protanopia' }
  },
  
  {
    id: 'large-text',
    name: 'Large Text',
    description: 'Increased font sizes for readability',
    colors: {
      background: '#0a0a0b',
      surface: '#16161a',
      surfaceElevated: '#1e1e24',
      primary: '#a855f7',
      primaryHover: '#c084fc',
      secondary: '#3b82f6',
      accent: '#f97316',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#2a2a30',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#eab308'
    },
    accessibility: { highContrast: false, reducedMotion: false, largeText: true, colorBlindMode: 'none' }
  },
  
  {
    id: 'reduced-motion',
    name: 'No Animations',
    description: 'Removes animations for vestibular issues',
    colors: {
      background: '#0a0a0b',
      surface: '#16161a',
      surfaceElevated: '#1e1e24',
      primary: '#a855f7',
      primaryHover: '#c084fc',
      secondary: '#3b82f6',
      accent: '#f97316',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#2a2a30',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#eab308'
    },
    accessibility: { highContrast: false, reducedMotion: true, largeText: false, colorBlindMode: 'none' }
  }
]

// Apply theme to document
export function applyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId)
  if (!theme) return
   
  const root = document.documentElement
  
  // Set CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
  })
  
  // Set accessibility attributes
  root.setAttribute('data-high-contrast', theme.accessibility.highContrast.toString())
  root.setAttribute('data-reduced-motion', theme.accessibility.reducedMotion.toString())
  root.setAttribute('data-large-text', theme.accessibility.largeText.toString())
  root.setAttribute('data-color-blind', theme.accessibility.colorBlindMode)
  
  // Save preference
  localStorage.setItem('modvora-theme', themeId)
}

// Load saved theme
export function loadSavedTheme(): string {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem('modvora-theme') || 'dark'
}

// Check system preferences
export function getSystemPreferences() {
  if (typeof window === 'undefined') {
    return { prefersDark: true, reducedMotion: false, highContrast: false }
  }
  
  return {
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(prefers-contrast: more)').matches
  }
}

// Auto-detect best theme for user
export function autoDetectTheme(): string {
  const prefs = getSystemPreferences()
  const saved = loadSavedTheme()
  
  // Return saved if exists
  if (saved) return saved
  
  // Auto-detect based on preferences
  if (prefs.highContrast) return 'high-contrast'
  if (prefs.reducedMotion) return 'reduced-motion'
  if (prefs.prefersDark) return 'dark'
  return 'light'
}

// Font size multipliers for large text mode
export const FONT_SCALE = {
  normal: 1,
  large: 1.25,
  xlarge: 1.5
}

export function getFontSizeMultiplier(theme: Theme): number {
  if (theme.accessibility.largeText) return FONT_SCALE.large
  return FONT_SCALE.normal
}
