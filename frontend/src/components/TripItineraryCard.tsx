import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Bookmark, Star } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  title: string;
  destination?: string | null;
  dateRange?: string | null;
  daysCount?: number | null;
  placesCount?: number | null;
  savesCount?: number | null;
  rating?: number | null;
  coverImageUrl?: string | null;
  badge?: string | null;
  onPress?: () => void;
}

export function TripItineraryCard({
  title,
  destination,
  dateRange,
  daysCount,
  placesCount,
  savesCount,
  rating,
  badge,
  onPress,
}: Props) {
  const { colors } = useTheme();
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
      hitSlop={4}
    >
      <LinearGradient
        colors={['#06b6d4', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.card }]}>
            <Text style={[styles.badgeText, { color: colors.foreground }]}>{badge}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{title}</Text>
        {destination ? (
          <View style={styles.row}>
            <MapPin size={13} color={colors.mutedForeground} />
            <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>{destination}</Text>
          </View>
        ) : null}
        {dateRange ? (
          <View style={styles.row}>
            <Calendar size={13} color={colors.primary} />
            <Text style={[styles.sub, { color: colors.primary }]} numberOfLines={1}>{dateRange}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {daysCount != null ? (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{daysCount} days</Text>
          ) : null}
          {placesCount != null ? (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{placesCount} places</Text>
          ) : null}
          {rating != null ? (
            <View style={styles.row}>
              <Star size={12} color={colors.warn} />
              <Text style={[styles.meta, { color: colors.warn }]}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {savesCount != null ? (
            <View style={styles.row}>
              <Bookmark size={12} color={colors.mutedForeground} />
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{savesCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cover: { height: 96, padding: 8, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { padding: 14, gap: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  meta: { fontSize: 12, fontWeight: '500' },
});
