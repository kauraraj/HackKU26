import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

export function SegmentedTab<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.seg, active && { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            hitSlop={4}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.foreground : colors.mutedForeground },
                active && { fontWeight: '700' },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: { fontSize: 14 },
});
