import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  title: string;
  subtitle?: string | null;
  reason?: string | null;
  category?: string | null;
  confidence?: number | null;
  thumbnailUrl?: string | null;
  onPress?: () => void;
  trailing?: React.ReactNode;
}

export function PlaceCard({ title, subtitle, reason, category, confidence, thumbnailUrl, onPress, trailing }: Props) {
  const { colors } = useTheme();
  const pct = confidence != null ? Math.round(confidence * 100) : null;
  const tone = pct == null ? null : pct >= 70 ? colors.ok : pct >= 40 ? colors.warn : colors.destructive;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumb} />
      ) : (
        <LinearGradient
          colors={['#06b6d4', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumb}
        />
      )}
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text> : null}
        {reason ? <Text style={[styles.reason, { color: colors.mutedForeground }]} numberOfLines={2}>{reason}</Text> : null}
        <View style={styles.metaRow}>
          {category ? (
            <Text style={[styles.chip, { color: colors.mutedForeground, backgroundColor: colors.secondary }]}>{category}</Text>
          ) : null}
          {pct != null ? (
            <Text style={[styles.chip, { color: tone!, backgroundColor: colors.secondary }]}>{pct}% match</Text>
          ) : null}
        </View>
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  reason: { fontSize: 13, marginTop: 6, opacity: 0.85 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
