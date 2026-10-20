import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, layout, shadow } from '@/theme/tokens';

type Weight = 400 | 500 | 600 | 700;

const bodyFont: Record<Weight, string> = {
  400: fonts.regular,
  500: fonts.medium,
  600: fonts.semibold,
  700: fonts.bold,
};

export interface TxtProps extends TextProps {
  size?: number;
  weight?: Weight;
  color?: string;
  /** Sora instead of IBM Plex Sans, for headings. */
  display?: boolean;
  lineHeight?: number;
  style?: StyleProp<TextStyle>;
}

/** Text with the app fonts. Custom fonts need one family per weight, so `fontWeight` is not used. */
export function Txt({
  size = 14,
  weight = 400,
  color = colors.ink,
  display,
  lineHeight,
  style,
  ...rest
}: TxtProps) {
  const fontFamily = display
    ? weight >= 700
      ? fonts.displayBold
      : fonts.displaySemibold
    : bodyFont[weight];
  return (
    <Text
      {...rest}
      style={[{ fontFamily, fontSize: size, color, lineHeight: lineHeight ?? size * 1.4 }, style]}
    />
  );
}

/** Pressable with hover and pressed state on all platforms. */
export function Touchable({
  style,
  hoverStyle,
  children,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <Pressable
      {...rest}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered;
        return [
          style,
          (hovered || state.pressed) && hoverStyle,
          state.pressed && { opacity: 0.85 },
          rest.disabled && { opacity: 0.45 },
        ];
      }}
    >
      {children}
    </Pressable>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'secondary',
  height = 40,
  size = 13.5,
  color,
  disabled,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  height?: number;
  size?: number;
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const v = buttonVariants[variant];
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={Math.max(0, (layout.touch - height) / 2)}
      style={[styles.button, { height }, v.box, style]}
      hoverStyle={v.hover}
    >
      <Txt size={size} weight={600} color={color ?? v.text}>
        {label}
      </Txt>
    </Touchable>
  );
}

const buttonVariants: Record<ButtonVariant, { box: ViewStyle; hover: ViewStyle; text: string }> = {
  primary: {
    box: { backgroundColor: colors.primary },
    hover: { backgroundColor: colors.primaryDark },
    text: '#FFFFFF',
  },
  secondary: {
    box: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.borderControl },
    hover: { backgroundColor: colors.hoverSoft },
    text: colors.text2,
  },
  ghost: {
    box: { backgroundColor: 'transparent' },
    hover: { backgroundColor: colors.hoverSoft },
    text: colors.text2,
  },
};

/** Square icon button, at least 44 x 44 including its hit slop. */
export function IconButton({
  children,
  onPress,
  label,
  size = 44,
  pressed,
  expanded,
  style,
  variant = 'ghost',
}: {
  children: ReactNode;
  onPress?: () => void;
  label: string;
  size?: number;
  pressed?: boolean;
  expanded?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
}) {
  const v = buttonVariants[variant];
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        ...(pressed !== undefined && { selected: pressed }),
        ...(expanded !== undefined && { expanded }),
      }}
      aria-pressed={pressed}
      onPress={onPress}
      hitSlop={Math.max(0, (layout.touch - size) / 2)}
      style={[
        styles.iconButton,
        { width: size, height: size },
        v.box,
        pressed && { backgroundColor: colors.active },
        style,
      ]}
      hoverStyle={v.hover}
    >
      {children}
    </Touchable>
  );
}

export function Switch({
  value,
  onChange,
  label,
  variant = 'default',
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** The settings screen uses a slightly smaller switch with a lighter track. */
  variant?: 'default' | 'settings';
}) {
  const small = variant === 'settings';
  const w = small ? 42 : 44;
  const h = small ? 24 : 26;
  const knob = small ? 18 : 20;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onChange(!value)}
      hitSlop={{ top: (layout.touch - h) / 2, bottom: (layout.touch - h) / 2 }}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        backgroundColor: value
          ? colors.primary
          : small
            ? colors.switchOffSettings
            : colors.switchOff,
      }}
    >
      <View
        style={[
          {
            position: 'absolute',
            top: 3,
            left: value ? w - knob - 3 : 3,
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            backgroundColor: '#FFFFFF',
          },
          shadow.knob,
        ]}
      />
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  background = colors.segment,
  height = 34,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  background?: string;
  height?: number;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.segmented, { backgroundColor: background }]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on, selected: on }}
            onPress={() => onChange(o.value)}
            hitSlop={{ top: (layout.touch - height) / 2, bottom: (layout.touch - height) / 2 }}
            style={[
              styles.segment,
              { height },
              on && { backgroundColor: '#FFFFFF' },
              on && shadow.segment,
            ]}
          >
            <Txt size={13} weight={600} color={on ? colors.navy : colors.muted}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bordered box with label/value rows, used for details in panels and settings. */
export function InfoTable({
  rows,
  size = 13.5,
  padding = { v: 11, h: 14 },
  valueWeight = 500,
}: {
  rows: { label: string; value: ReactNode; valueColor?: string; valueWeight?: Weight }[];
  size?: number;
  padding?: { v: number; h: number };
  valueWeight?: Weight;
}) {
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={[
            styles.tableRow,
            { paddingVertical: padding.v, paddingHorizontal: padding.h },
            i < rows.length - 1 && styles.tableRowBorder,
          ]}
        >
          <Txt size={size} color={colors.muted}>
            {r.label}
          </Txt>
          {typeof r.value === 'string' ? (
            <Txt
              size={size}
              weight={r.valueWeight ?? valueWeight}
              color={r.valueColor}
              style={styles.tableValue}
            >
              {r.value}
            </Txt>
          ) : (
            r.value
          )}
        </View>
      ))}
    </View>
  );
}

export function SectionLabel({
  children,
  color = colors.text2,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <Txt size={12.5} weight={600} color={color} accessibilityRole="header">
      {children}
    </Txt>
  );
}

export function Chip({ label, bg, fg = colors.ink }: { label: string; bg: string; fg?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Txt size={13} color={fg}>
        {label}
      </Txt>
    </View>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: { borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: 9 },
  segment: { flex: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  table: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 12 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  tableValue: { textAlign: 'right', flexShrink: 1 },
  chip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 14 },
});
