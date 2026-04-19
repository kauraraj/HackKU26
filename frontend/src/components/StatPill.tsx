import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  label: string;
  value: number | string;
  onPress?: () => void;
  emphasis?: boolean;
}

export function StatPill({ label, value, onPress, emphasis }: Props) {
  const { colors } = useTheme();
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.wrap,
          { backgroundColor: emphasis ? colors.accentBg : colors.secondary },
          pressed && { opacity: 0.8 },
        ]}
        hitSlop={4}
      >
        <Text style={[styles.value, { color: emphasis ? colors.accentFg : colors.foreground }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={[styles.wrap, { backgroundColor: emphasis ? colors.accentBg : colors.secondary }]}>
      <Text style={[styles.value, { color: emphasis ? colors.accentFg : colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  value: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '500' },
});
