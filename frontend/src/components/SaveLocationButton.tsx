import { Pressable, StyleSheet, Text } from 'react-native';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  saved: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export function SaveLocationButton({ saved, onToggle, compact }: Props) {
  const { colors } = useTheme();
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.wide,
        {
          backgroundColor: saved ? colors.accentBg : colors.secondary,
          borderColor: saved ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
      hitSlop={4}
    >
      <Icon size={compact ? 16 : 18} color={saved ? colors.primary : colors.foreground} />
      {!compact ? (
        <Text style={[styles.label, { color: saved ? colors.primary : colors.foreground }]}>
          {saved ? 'Saved' : 'Save'}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  compact: { width: 34, height: 34 },
  wide: { paddingHorizontal: 14, paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '600' },
});
