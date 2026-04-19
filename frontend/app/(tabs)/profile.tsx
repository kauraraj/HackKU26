import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/profile';
import type { Profile } from '@/types';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile).catch(() => setProfile(null));
    }, [])
  );

  return (
    <Screen scroll>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {profile?.display_name ?? user?.email}
        </Text>
        <Text style={[styles.username, { color: colors.mutedForeground }]}>
          @{profile?.username ?? '—'}
        </Text>
        {profile?.home_city ? (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>🏠 {profile.home_city}</Text>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {profile?.saved_places_count ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saved places</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {profile?.trips_count ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips planned</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={signOut}
        activeOpacity={0.8}
        style={[styles.signOutBtn, { backgroundColor: colors.destructive }]}
        hitSlop={4}
      >
        <LogOut size={18} color="#fff" />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 22, fontWeight: '700' },
  username: { fontSize: 14 },
  sub: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 13 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
