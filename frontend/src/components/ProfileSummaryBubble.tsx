import { Image, Pressable, StyleSheet, Text, View, GestureResponderEvent } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { StatPill } from './StatPill';

interface Props {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  homeCity: string | null;
  tripsCount: number;
  savedCount: number;
  postedCount: number;
  friendsCount: number;
  onPress: () => void;
  onFriendsPress?: () => void;
}

export function ProfileSummaryBubble({
  displayName,
  username,
  avatarUrl,
  homeCity,
  tripsCount,
  savedCount,
  postedCount,
  friendsCount,
  onPress,
  onFriendsPress,
}: Props) {
  const { colors } = useTheme();
  const initials =
    displayName
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const handleFriendsPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onFriendsPress?.();
  };

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
        pressed && { opacity: 0.95 },
      ]}
      hitSlop={4}
    >
      <View style={styles.topRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accentFg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {displayName}
          </Text>
          {username ? (
            <Text style={[styles.username, { color: colors.mutedForeground }]} numberOfLines={1}>
              @{username}
            </Text>
          ) : null}
          {homeCity ? (
            <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
              🏠 {homeCity}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={22} color={colors.mutedForeground} />
      </View>

      <View style={styles.statsRow}>
        <StatPill label="trips" value={tripsCount} />
        <StatPill label="saved" value={savedCount} />
        <StatPill label="posted" value={postedCount} />
        <Pressable
          onPress={handleFriendsPress}
          style={[styles.friendsPill, { backgroundColor: colors.accentBg }]}
          hitSlop={4}
        >
          <Users size={14} color={colors.accentFg} />
          <Text style={[styles.friendsValue, { color: colors.accentFg }]}>{friendsCount}</Text>
          <Text style={[styles.friendsLabel, { color: colors.accentFg }]}>friends</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: colors.mutedForeground }]}>Tap to view your public profile</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },
  identity: { flex: 1, gap: 2 },
  name: { fontSize: 20, fontWeight: '800' },
  username: { fontSize: 14 },
  sub: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  friendsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  friendsValue: { fontSize: 14, fontWeight: '700' },
  friendsLabel: { fontSize: 12, fontWeight: '500' },
  hint: { fontSize: 12, textAlign: 'right' },
});
