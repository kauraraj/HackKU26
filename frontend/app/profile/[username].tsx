import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pin, UserPlus, UserCheck } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { TripItineraryCard } from '@/components/TripItineraryCard';
import { StatPill } from '@/components/StatPill';
import { useTheme } from '@/context/ThemeContext';
import { getPinnedItems, getPostedItineraries, getPublicProfile } from '@/services/social';
import type { PinnedItem, PostedItinerary, PublicProfile } from '@/types/social';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posted, setPosted] = useState<PostedItinerary[]>([]);
  const [pinned, setPinned] = useState<PinnedItem[]>([]);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!username) return;
    getPublicProfile(username).then((p) => {
      setProfile(p);
      setFollowing(p.is_following);
    });
    getPostedItineraries().then(setPosted);
    getPinnedItems().then(setPinned);
  }, [username]);

  if (!profile) return <LoadingState label="Loading profile…" />;

  const initials =
    profile.display_name
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <Screen scroll>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
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
        <Text style={[styles.name, { color: colors.foreground }]}>{profile.display_name}</Text>
        <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profile.username}</Text>
        {profile.home_city ? (
          <Text style={[styles.homeCity, { color: colors.mutedForeground }]}>🏠 {profile.home_city}</Text>
        ) : null}
        {profile.bio ? (
          <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
        ) : null}

        <View style={styles.stats}>
          <StatPill label="trips" value={profile.trips_count} />
          <StatPill label="posted" value={profile.posted_count} />
          <StatPill label="friends" value={profile.friends_count} emphasis />
        </View>

        <Pressable
          onPress={() => setFollowing((f) => !f)}
          style={({ pressed }) => [
            styles.followBtn,
            {
              backgroundColor: following ? colors.secondary : colors.primary,
              borderColor: following ? colors.border : colors.primary,
            },
            pressed && { opacity: 0.9 },
          ]}
          hitSlop={4}
        >
          {following ? (
            <UserCheck size={16} color={colors.foreground} />
          ) : (
            <UserPlus size={16} color={colors.primaryForeground} />
          )}
          <Text
            style={[
              styles.followLabel,
              { color: following ? colors.foreground : colors.primaryForeground },
            ]}
          >
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      {pinned.length > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={styles.sectionHeader}>
            <Pin size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pinned</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {pinned.map((pin) => (
              <View
                key={pin.id}
                style={[styles.pinCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <LinearGradient
                  colors={['#06b6d4', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pinThumb}
                />
                <Text style={[styles.pinTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {pin.title}
                </Text>
                {pin.subtitle ? (
                  <Text style={[styles.pinSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {pin.subtitle}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Posted itineraries</Text>
        {posted.length === 0 ? (
          <EmptyState title="Nothing posted yet" subtitle="Public itineraries will show here." />
        ) : (
          posted.map((p) => (
            <TripItineraryCard
              key={p.id}
              title={p.title}
              destination={p.destination}
              daysCount={p.days_count}
              placesCount={p.places_count}
              savesCount={p.saves}
              rating={p.rating}
              badge="POSTED"
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800' },
  username: { fontSize: 14 },
  homeCity: { fontSize: 13 },
  bio: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  followLabel: { fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  pinCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  pinThumb: { height: 80, borderRadius: 8 },
  pinTitle: { fontSize: 14, fontWeight: '700' },
  pinSub: { fontSize: 12 },
});
