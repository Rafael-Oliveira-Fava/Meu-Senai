import { Easing, Platform } from 'react-native';

/**
 * Meu SENAI tokens. Palette pinned by the brief: blue primary, white secondary,
 * red and black for detail. Status colors always ship with an icon and a word.
 */
export const color = {
  primary: '#0B4DA2',
  primaryPressed: '#093F86',
  primaryDeep: '#073273',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#C9DAF3',
  primaryContainer: '#E3ECFA',
  onPrimaryContainer: '#0A3A7A',

  bg: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FC',
  ink: '#111418',
  text: '#1F2937',
  muted: '#566173',
  outline: '#DCE2EB',
  outlineStrong: '#B9C3D1',

  /** SENAI red: brand stripe, wordmark, FAB, section markers, counts and alerts. */
  red: '#E30613',
  redPressed: '#BF0511',
  redContainer: '#FDE4E5',
  onRedContainer: '#8C0710',

  green: '#1C7A45',
  greenContainer: '#E0F3E7',
  amber: '#8A5300',
  amberContainer: '#FFF0D4',

  scrim: 'rgba(17,20,24,0.45)',
} as const;

export const font = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
} as const;

/** Material-style type scale (sizes in sp, follow system font scale). */
export const type = {
  display: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  headline: { fontFamily: font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  title: { fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
  titleSm: { fontFamily: font.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: font.medium, fontSize: 14, lineHeight: 20 },
  labelSm: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  numeric: { fontFamily: font.medium, fontVariant: ['tabular-nums' as const] },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
/**
 * One shape language. Anything you tap is a pill or a circle; containers use
 * three fixed radii by role. No other values.
 */
export const radius = { field: 16, card: 20, sheet: 28, pill: 999 } as const;

/** Height of the red SENAI stripe under every blue header. */
export const BRAND_STRIPE = 4;

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(17,20,24,0.06), 0 4px 14px rgba(11,77,162,0.07)' },
  default: { elevation: 2, shadowColor: '#0B2550', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
}) as object;

export const shadowRaised = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(17,20,24,0.06), 0 10px 28px rgba(11,77,162,0.12)' },
  default: { elevation: 6, shadowColor: '#0B2550', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
}) as object;

/** Motion: strong ease-out for responses, short durations (state, not decoration). */
export const motion = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  press: 160,
  enter: 240,
  exit: 160,
  stagger: 40,
  nativeDriver: Platform.OS !== 'web',
} as const;

export const MIN_TOUCH = 48;
