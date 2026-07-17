// ============================================================
// UNIVERSAL THEME ENGINE & CONTRAST ENGINE (WCAG Compliance)
// ============================================================

export interface ThemeTokens {
  '--color-background': string;
  '--color-surface': string;
  '--color-surface-hover': string;
  '--color-primary': string;
  '--color-text-primary': string;
  '--color-text-secondary': string;
  '--color-text-muted': string;
  '--color-border': string;
  '--color-success': string;
  '--color-warning': string;
  '--color-danger': string;
  '--color-link': string;
  '--color-button': string;
  '--color-button-text': string;
  '--color-navbar': string;
  '--color-navbar-text': string;
  '--color-footer': string;
  '--color-footer-text': string;
  '--border-radius': string;
  '--font-family': string;
  '--button-style': string;
}

// 1. RGB Conversions
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const cleanHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 37, g: 99, b: 235 }; // default blue #2563eb
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return "#" + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

// 2. HSL Conversions
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255)
  };
}

// 3. Relative Luminance
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// 4. Contrast Ratio
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// 5. Automatic Foreground Contrast Adjuster (WCAG target check)
export function adjustContrast(foreground: string, background: string, targetRatio = 4.5): string {
  let ratio = getContrastRatio(foreground, background);
  if (ratio >= targetRatio) return foreground;

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const fgHsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);

  let currentL = fgHsl.l;
  // Progressively adjust lightness in steps of 1.5%
  for (let i = 0; i < 70; i++) {
    if (bgLuminance > 0.5) {
      currentL -= 1.5; // Darken on light background
    } else {
      currentL += 1.5; // Lighten on dark background
    }

    if (currentL < 0) { currentL = 0; break; }
    if (currentL > 100) { currentL = 100; break; }

    const adjustedRgb = hslToRgb(fgHsl.h, fgHsl.s, currentL);
    const adjustedHex = rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
    ratio = getContrastRatio(adjustedHex, background);

    if (ratio >= targetRatio) {
      return adjustedHex;
    }
  }

  // Fallback to absolute contrast color if loop fails
  return bgLuminance > 0.5 ? '#000000' : '#ffffff';
}

// 6. Token Generator
export function generateThemeTokens(
  primaryColor: string,
  resolvedMode: 'light' | 'dark',
  fontFamily: string,
  borderRadiusStyle: 'modern' | 'rounded' | 'square',
  buttonStyle: 'filled' | 'outline' | 'soft'
): ThemeTokens {
  // Base canvas colors setup
  const isDark = resolvedMode === 'dark';
  const background = isDark ? '#070d1a' : '#f8fafc';
  const surface = isDark ? '#0d1526' : '#ffffff';
  const surfaceHover = isDark ? '#1e293b' : '#f1f5f9';
  const border = isDark ? '#1e293b' : '#e2e8f0';

  // Base semantic text setup
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#475569';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  // Accents & Alerts (corrected to pass target contrast ratio against background)
  const successColor = adjustContrast('#10b981', background, 3.5);
  const warningColor = adjustContrast('#f59e0b', background, 3.5);
  const dangerColor = adjustContrast('#ef4444', background, 3.5);
  const linkColor = adjustContrast(primaryColor, background, 4.5);

  // Buttons configurations
  let btnBg = primaryColor;
  let btnText = '#ffffff';

  if (buttonStyle === 'outline') {
    btnBg = 'transparent';
    btnText = adjustContrast(primaryColor, background, 4.5);
  } else if (buttonStyle === 'soft') {
    btnBg = primaryColor + '22'; // 13% opacity overlay hex
    btnText = adjustContrast(primaryColor, background, 4.5);
  } else {
    // Filled: ensure contrast of button text against the primary button background color
    btnBg = primaryColor;
    const lightTextRatio = getContrastRatio('#ffffff', primaryColor);
    const darkTextRatio = getContrastRatio('#0f172a', primaryColor);
    btnText = lightTextRatio >= darkTextRatio ? '#ffffff' : '#0f172a';
    
    // In case both fail target 4.5:1 ratio, force adjust text
    if (Math.max(lightTextRatio, darkTextRatio) < 4.5) {
      btnText = adjustContrast(btnText, primaryColor, 4.5);
    }
  }

  // Header and Navigation
  const navbarBg = isDark ? '#070d1a' : '#ffffff';
  const navbarText = adjustContrast(isDark ? '#cbd5e1' : '#475569', navbarBg, 4.5);

  // Footer configurations
  const footerBg = isDark ? '#020617' : '#0f172a';
  const footerText = adjustContrast('#cbd5e1', footerBg, 4.5);

  // Radius values
  let radius = '8px';
  if (borderRadiusStyle === 'modern') radius = '16px';
  if (borderRadiusStyle === 'square') radius = '0px';

  return {
    '--color-background': background,
    '--color-surface': surface,
    '--color-surface-hover': surfaceHover,
    '--color-primary': primaryColor,
    '--color-text-primary': textPrimary,
    '--color-text-secondary': textSecondary,
    '--color-text-muted': textMuted,
    '--color-border': border,
    '--color-success': successColor,
    '--color-warning': warningColor,
    '--color-danger': dangerColor,
    '--color-link': linkColor,
    '--color-button': btnBg,
    '--color-button-text': btnText,
    '--color-navbar': navbarBg,
    '--color-navbar-text': navbarText,
    '--color-footer': footerBg,
    '--color-footer-text': footerText,
    '--border-radius': radius,
    '--font-family': fontFamily || 'Inter, sans-serif',
    '--button-style': buttonStyle
  };
}
