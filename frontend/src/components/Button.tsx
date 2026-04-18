import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator color={theme.colors.text} /> : <Text style={styles.label}>{title}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: theme.colors.accent },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  inner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  label: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
});
