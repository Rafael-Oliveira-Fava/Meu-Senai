import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { forwardRef, useState, type ComponentProps, type ComponentRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReviewStatus, TicketStatus } from '../data/types';
import { initials } from '../lib/format';
import { BRAND_STRIPE, color, MIN_TOUCH, radius, shadow, space, type } from '../theme';
import { PressScale } from './motion';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 22, tint = color.text }: { name: IconName; size?: number; tint?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={tint} />;
}

/* ───────────── Layout ───────────── */

/**
 * Blue header for inner screens, same family as the home header: curved bottom
 * and red SENAI stripe. One row: round back button, title + subtitle, then the
 * MEU SENAI logo or header actions. System Back still works.
 */
export function AppBar({ title, subtitle, right, back = true }: { title: string; subtitle?: string; right?: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.appBar, { paddingTop: insets.top + space.md }]}>
      <View style={s.appBarRow}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [s.backBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.26)' }]}
            hitSlop={4}
          >
            <Icon name="arrow-left" size={22} tint={color.onPrimary} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: color.onPrimary, fontSize: 20, lineHeight: 26 }]} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={[type.bodySm, { color: color.onPrimaryMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? (back ? <Wordmark size={12} /> : null)}
      </View>
    </View>
  );
}

export function Screen({ children, contentStyle, footer }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle>; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: color.bg }}
        contentContainerStyle={[{ padding: space.lg, paddingBottom: space.xxxl + (footer ? 0 : insets.bottom) }, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.column}>{children}</View>
      </ScrollView>
      {footer ? <View style={[s.footer, { paddingBottom: space.md + insets.bottom }]}>{footer}</View> : null}
    </View>
  );
}

export function SectionTitle({ children, action, count }: { children: string; action?: { label: string; onPress: () => void }; count?: number }) {
  return (
    <View style={s.sectionTitle}>
      <View style={s.sectionMarker} />
      <Text style={[type.title, { color: color.ink, flex: 1 }]} accessibilityRole="header">
        {children}
      </Text>
      {count ? (
        <View style={s.sectionCount} accessibilityLabel={`${count} itens`}>
          <Text style={[type.labelSm, { color: '#fff' }]}>{count}</Text>
        </View>
      ) : null}
      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={6}
          accessibilityRole="button"
          style={({ pressed }) => [s.textAction, pressed && { backgroundColor: color.primaryContainer }]}
        >
          <Text style={[type.label, { color: color.primary }]}>{action.label}</Text>
          <Icon name="chevron-right" size={18} tint={color.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const LOGO_WHITE = require('../../assets/meu-senai-logo-white.png');
const LOGO_BLUE = require('../../assets/meu-senai-logo.png');
const LOGO_RATIO = 1371 / 186;

/**
 * "MEU SENAI" logo: the official SENAI mark (Wikimedia Commons, CC BY-SA 4.0)
 * with "MEU" set in Exo 2 ExtraBold, slanted 10° to match the mark's lettering.
 * White version on blue, blue version on light grounds. `size` is the cap height.
 */
export function Wordmark({ size = 20, onDark = true }: { size?: number; onDark?: boolean }) {
  const h = Math.round(size * 1.1);
  return (
    <Image
      source={onDark ? LOGO_WHITE : LOGO_BLUE}
      style={{ height: h, width: h * LOGO_RATIO }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Meu SENAI"
      accessibilityIgnoresInvertColors
    />
  );
}

/* ───────────── Surfaces ───────────── */

export function Card({ children, onPress, style, accessibilityLabel }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return (
    <PressScale onPress={onPress} style={[s.card, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel} scaleTo={0.985}>
      {children}
    </PressScale>
  );
}

export function Avatar({ name, size = 44, tone = 'light', ring }: { name: string; size?: number; tone?: 'light' | 'blue' | 'dark'; ring?: boolean }) {
  const bg = tone === 'light' ? color.onPrimary : tone === 'blue' ? color.primaryContainer : color.ink;
  const fg = tone === 'dark' ? color.onPrimary : color.primary;
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        ring && { borderWidth: 2.5, borderColor: color.red },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text style={{ fontFamily: type.title.fontFamily, fontSize: size * 0.38, color: fg }}>{initials(name)}</Text>
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color.outline, marginLeft: inset }} />;
}

/* ───────────── Buttons ───────────── */

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger' | 'dangerOutlined';

export function Button({
  label,
  onPress,
  variant = 'filled',
  icon,
  loading,
  disabled,
  full,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  accessibilityHint?: string;
}) {
  const v = BUTTON[variant];
  const off = disabled || loading;
  return (
    <PressScale
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={[s.btn, { backgroundColor: v.bg, borderColor: v.border ?? v.bg }, full && { alignSelf: 'stretch' }, off && { opacity: 0.5 }]}
    >
      {loading ? <ActivityIndicator color={v.fg} size="small" /> : icon ? <Icon name={icon} size={20} tint={v.fg} /> : null}
      <Text style={[type.label, { color: v.fg, fontSize: 15 }]}>{label}</Text>
    </PressScale>
  );
}

const BUTTON: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  filled: { bg: color.primary, fg: color.onPrimary },
  tonal: { bg: color.primaryContainer, fg: color.onPrimaryContainer },
  outlined: { bg: 'transparent', fg: color.primary, border: color.outlineStrong },
  text: { bg: 'transparent', fg: color.primary },
  danger: { bg: color.red, fg: '#FFFFFF' },
  dangerOutlined: { bg: 'transparent', fg: color.red, border: '#F0B4B7' },
};

export function Fab({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[s.fab, { bottom: space.lg }]}>
      <Icon name={icon} tint={color.onPrimary} />
      <Text style={[type.label, { color: color.onPrimary, fontSize: 15 }]}>{label}</Text>
    </PressScale>
  );
}

/* ───────────── Status ───────────── */

type Tone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'dark';
const TONE: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#EEF1F5', fg: color.muted },
  blue: { bg: color.primaryContainer, fg: color.onPrimaryContainer },
  green: { bg: color.greenContainer, fg: color.green },
  amber: { bg: color.amberContainer, fg: color.amber },
  red: { bg: color.redContainer, fg: color.onRedContainer },
  dark: { bg: color.ink, fg: '#FFFFFF' },
};

export function Badge({ label, tone = 'neutral', icon, style }: { label: string; tone?: Tone; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const t = TONE[tone];
  return (
    <View style={[s.badge, { backgroundColor: t.bg }, style]}>
      {icon ? <Icon name={icon} size={14} tint={t.fg} /> : null}
      <Text style={[type.labelSm, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/** Review status: never color alone, always icon + word (RNF03). */
export function StatusBadge({ status, labels }: { status: ReviewStatus; labels?: Partial<Record<ReviewStatus, string>> }) {
  if (status === 'aprovado') return <Badge tone="green" icon="check-circle" label={labels?.aprovado ?? 'Aprovado'} />;
  if (status === 'recusado') return <Badge tone="red" icon="close-circle" label={labels?.recusado ?? 'Recusado'} />;
  return <Badge tone="amber" icon="clock-outline" label={labels?.pendente ?? 'Pendente'} />;
}

export function TicketBadge({ status }: { status: TicketStatus }) {
  if (status === 'respondido') return <Badge tone="blue" icon="message-reply-text" label="Respondido" />;
  if (status === 'encerrado') return <Badge tone="neutral" icon="check" label="Encerrado" />;
  return <Badge tone="amber" icon="clock-outline" label="Aguardando" />;
}

export function UnreadDot({ label = 'Não lido' }: { label?: string }) {
  return <View accessibilityLabel={label} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.red }} />;
}

/* ───────────── Inputs ───────────── */

export function Chip({ label, selected, onPress, icon, count }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; count?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count}` : label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && { opacity: 0.85 }]}
    >
      {selected ? <Icon name="check" size={16} tint={color.onPrimaryContainer} /> : icon ? <Icon name={icon} size={16} tint={color.muted} /> : null}
      <Text style={[type.label, { color: selected ? color.onPrimaryContainer : color.text }]}>{label}</Text>
      {count ? (
        <View style={s.chipCount}>
          <Text style={[type.labelSm, { color: '#fff' }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }} style={{ flexGrow: 0 }}>
      {children}
    </ScrollView>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string | null; helper?: string; required?: boolean };

export const Field = forwardRef<ComponentRef<typeof TextInput>, FieldProps>(function Field({ label, error, helper, required, style, multiline, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.label, { color: color.text }]}>
        {label}
        {required ? <Text style={{ color: color.red }}> *</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor="#7A8494"
        selectionColor={color.primary}
        cursorColor={color.primary}
        accessibilityLabel={label}
        multiline={multiline}
        style={[s.input, multiline && { minHeight: 120, textAlignVertical: 'top', paddingTop: 14 }, focused && s.inputFocus, !!error && { borderColor: color.red }, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={16} tint={color.red} />
          <Text style={[type.bodySm, { color: color.onRedContainer, flex: 1 }]}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={[type.bodySm, { color: color.muted }]}>{helper}</Text>
      ) : null}
    </View>
  );
});

/** Single choice as large tappable rows (radio semantics). */
export function OptionList<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T | null;
  options: { id: T; label: string; hint?: string; icon?: IconName }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup">
      {label ? <Text style={[type.label, { color: color.text }]}>{label}</Text> : null}
      <View style={s.optionBox}>
        {options.map((o, i) => {
          const on = o.id === value;
          return (
            <View key={o.id}>
              {i > 0 ? <Divider inset={space.lg} /> : null}
              <Pressable
                onPress={() => onChange(o.id)}
                accessibilityRole="radio"
                accessibilityLabel={o.hint ? `${o.label}, ${o.hint}` : o.label}
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [s.optionRow, pressed && { backgroundColor: color.surfaceAlt }, on && { backgroundColor: '#F2F6FD' }]}
              >
                {o.icon ? <Icon name={o.icon} tint={on ? color.primary : color.muted} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={[type.titleSm, { color: color.ink }]}>{o.label}</Text>
                  {o.hint ? <Text style={[type.bodySm, { color: color.muted }]}>{o.hint}</Text> : null}
                </View>
                <View style={[s.radio, on && { borderColor: color.primary }]}>{on ? <View style={s.radioDot} /> : null}</View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} style={[s.optionBox, s.optionRow]}>
      <View style={{ flex: 1 }}>
        <Text style={[type.titleSm, { color: color.ink }]}>{label}</Text>
        {hint ? <Text style={[type.bodySm, { color: color.muted }]}>{hint}</Text> : null}
      </View>
      <View style={[s.track, value && { backgroundColor: color.primary, borderColor: color.primary }]}>
        <View style={[s.thumb, value ? { alignSelf: 'flex-end', backgroundColor: '#fff', width: 24, height: 24 } : null]}>
          {value ? <Icon name="check" size={16} tint={color.primary} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={s.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      <Icon name="alert-circle" size={20} tint={color.red} />
      <Text style={[type.bodySm, { color: color.onRedContainer, flex: 1 }]}>{message}</Text>
    </View>
  );
}

/* ───────────── Empty / rows ───────────── */

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={28} tint={color.primary} />
      </View>
      <Text style={[type.titleSm, { color: color.ink, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.bodySm, { color: color.muted, textAlign: 'center', maxWidth: 300 }]}>{text}</Text>
      {action ? (
        <View style={{ marginTop: space.sm }}>
          <Button label={action.label} onPress={action.onPress} variant="tonal" />
        </View>
      ) : null}
    </View>
  );
}

export function InfoRow({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <View>
      <View style={s.infoRow}>
        <Icon name={icon} size={20} tint={color.muted} />
        <Text style={[type.bodySm, { color: color.muted, width: 118 }]}>{label}</Text>
        <Text style={[type.body, { color: color.ink, flex: 1, fontFamily: type.label.fontFamily }]}>{value}</Text>
      </View>
      {last ? null : <Divider inset={48} />}
    </View>
  );
}

const s = StyleSheet.create({
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.lg },
  appBar: {
    backgroundColor: color.primary,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    borderBottomWidth: BRAND_STRIPE,
    borderBottomColor: color.red,
    zIndex: 1,
    ...shadow,
  },
  appBarRow: { width: '100%', maxWidth: 640, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MIN_TOUCH },
  backBtn: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', marginLeft: -2 },
  iconBtn: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: color.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.outline, paddingHorizontal: space.lg, paddingTop: space.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  sectionMarker: { width: 4, height: 20, borderRadius: radius.pill, backgroundColor: color.red },
  sectionCount: { minWidth: 24, height: 24, borderRadius: radius.pill, backgroundColor: color.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  textAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: space.md, paddingRight: space.sm, borderRadius: radius.pill },
  card: { backgroundColor: color.surface, borderRadius: radius.card, padding: space.lg, ...shadow },
  btn: { minHeight: MIN_TOUCH, borderRadius: radius.pill, paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderWidth: 1 },
  fab: { position: 'absolute', right: space.lg, minHeight: 56, borderRadius: radius.pill, backgroundColor: color.red, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, ...shadow },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  chip: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: color.outlineStrong, backgroundColor: color.surface },
  chipOn: { backgroundColor: color.primaryContainer, borderColor: color.primaryContainer },
  chipCount: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: color.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  inputFocus: { borderColor: color.primary, borderWidth: 2, paddingHorizontal: 15 },
  input: { minHeight: 52, borderWidth: 1, borderColor: color.outlineStrong, borderRadius: radius.field, backgroundColor: color.surface, paddingHorizontal: 16, fontFamily: type.body.fontFamily, fontSize: 16, color: color.ink },
  optionBox: { backgroundColor: color.surface, borderRadius: radius.field, borderWidth: 1, borderColor: color.outline, overflow: 'hidden' },
  optionRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.outlineStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: color.primary },
  track: { width: 52, height: 32, borderRadius: 16, borderWidth: 2, borderColor: color.outlineStrong, backgroundColor: '#EEF1F5', padding: 2, justifyContent: 'center' },
  thumb: { width: 16, height: 16, borderRadius: radius.pill, backgroundColor: color.muted, marginLeft: 4, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { flexDirection: 'row', gap: space.sm, alignItems: 'center', backgroundColor: color.redContainer, borderRadius: radius.field, padding: space.md },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52, paddingVertical: space.sm },
});
