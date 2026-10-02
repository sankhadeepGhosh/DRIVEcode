export const FONT_DEFINITIONS = {
  inter: {
    id: 'inter',
    label: 'Inter / Plus Jakarta',
    family: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  geist: {
    id: 'geist',
    label: 'Geist Sans',
    family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  roboto: {
    id: 'roboto',
    label: 'Roboto',
    family: "Roboto, system-ui, -apple-system, sans-serif",
  },
  system: {
    id: 'system',
    label: 'System Native',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  ibmPlexSans: {
    id: 'ibmPlexSans',
    label: 'IBM Plex Sans',
    family: "'IBM Plex Sans', -apple-system, system-ui, sans-serif",
  },
  newsreader: {
    id: 'newsreader',
    label: 'Newsreader Serif',
    family: "'Newsreader', Georgia, serif",
  },
  jetbrainsMono: {
    id: 'jetbrainsMono',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
  },
} as const;

export const FONT_SIZES = {
  small: {
    id: 'small',
    label: 'Small',
    bodyClass: 'text-[13px] leading-relaxed',
    markdownClass: 'text-[13px]',
  },
  medium: {
    id: 'medium',
    label: 'Medium (Default)',
    bodyClass: 'text-sm leading-relaxed',
    markdownClass: 'text-sm',
  },
  large: {
    id: 'large',
    label: 'Large',
    bodyClass: 'text-base leading-relaxed',
    markdownClass: 'text-base',
  },
  xlarge: {
    id: 'xlarge',
    label: 'Extra Large',
    bodyClass: 'text-lg leading-relaxed',
    markdownClass: 'text-lg',
  },
} as const;

export function applyTypography(fontId: keyof typeof FONT_DEFINITIONS, fontSizeId: keyof typeof FONT_SIZES) {
  const fontDef = FONT_DEFINITIONS[fontId] || FONT_DEFINITIONS.inter;
  document.documentElement.style.setProperty('--font-sans', fontDef.family);
  document.body.style.fontFamily = fontDef.family;

  const fontSizes: Record<string, string> = {
    small: '14px',
    medium: '15px',
    large: '16px',
    xlarge: '18px',
  };
  document.documentElement.style.fontSize = fontSizes[fontSizeId] || '15px';
}
