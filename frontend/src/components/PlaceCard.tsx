import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

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
  const pct = confidence != null ? Math.round(confidence * 100) : null;
  const tone = pct == null ? null : pct >= 70 ? theme.colors.ok : pct >= 40 ? theme.colors.warn : theme.colors.danger;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {thumbnailUrl ? <Image source={{ uri: thumbnailUrl }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbFallback]} />}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        {reason ? <Text style={styles.reason} numberOfLines={2}>{reason}</Text> : null}
        <View style={styles.metaRow}>
          {category ? <Text style={styles.chip}>{category}</Text> : null}
          {pct != null ? <Text style={[styles.chip, { color: tone! }]}>{pct}% match</Text> : null}
        </View>
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  thumb: { width: 72, height: 72, borderRadius: theme.radius.sm, backgroundColor: theme.colors.bgElevated },
  thumbFallback: { backgroundColor: theme.colors.bgElevated },
  body: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  subtitle: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  reason: { color: theme.colors.text, fontSize: 13, marginTop: 6, opacity: 0.85 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { fontSize: 11, color: theme.colors.textDim, backgroundColor: theme.colors.bgElevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
