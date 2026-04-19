import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Bookmark, Star } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { FeedItem } from '@/types/feed';

interface Props {
  item: FeedItem;
  onPress: () => void;
}

function AvatarInitials({ name, size = 32 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentBg,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.accentFg, fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

export function FeedTripCard({ item, onPress }: Props) {
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
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <LinearGradient
        colors={['#0ea5e9', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      />

      <View style={styles.body}>
        <View style={styles.creatorRow}>
          <AvatarInitials name={item.creator.display_name} />
          <Text style={[styles.creatorName, { color: colors.foreground }]} numberOfLines={1}>
            {item.creator.display_name}
          </Text>
          {item.creator.is_friend && (
            <View style={[styles.friendBadge, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.friendBadgeText, { color: colors.accentFg }]}>Friend</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.row}>
          <MapPin size={13} color={colors.mutedForeground} />
          <Text style={[styles.destination, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.destination}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {item.days_count} days · {item.places_count} places
          </Text>
          <View style={styles.row}>
            <Bookmark size={12} color={colors.mutedForeground} />
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.saves}</Text>
          </View>
          {item.rating != null && (
            <View style={styles.row}>
              <Star size={12} color={colors.warn} fill={colors.warn} />
              <Text style={[styles.meta, { color: colors.warn }]}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cover: { height: 120 },
  body: { padding: 14, gap: 8 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  creatorName: { fontSize: 13, fontWeight: '600', flex: 1 },
  friendBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  friendBadgeText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  destination: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  meta: { fontSize: 12, fontWeight: '500' },
});
