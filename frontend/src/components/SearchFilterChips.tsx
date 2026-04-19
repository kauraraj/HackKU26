import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { SearchFilter } from '@/types/search';

const FILTERS: { key: SearchFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'users', label: 'Users' },
  { key: 'locations', label: 'Locations' },
  { key: 'itineraries', label: 'Itineraries' },
];

interface Props {
  active: SearchFilter;
  onChange: (filter: SearchFilter) => void;
}

export function SearchFilterChips({ active, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.primary : colors.secondary,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: '600' },
});
