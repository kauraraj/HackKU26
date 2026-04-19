import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyle = {
    primary: { backgroundColor: colors.primary },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    danger: { backgroundColor: colors.destructive },
  }[variant];

  const textColor = variant === 'ghost' ? colors.foreground : colors.primaryForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {loading
          ? <ActivityIndicator color={textColor} />
          : <Text style={[styles.label, { color: textColor }]}>{title}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  inner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontWeight: '600' },
});
