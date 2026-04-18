import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { theme } from '@/components/theme';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/profile';
import type { Profile } from '@/types';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile).catch(() => setProfile(null));
    }, [])
  );

  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text style={styles.name}>{profile?.display_name ?? user?.email}</Text>
        <Text style={styles.sub}>@{profile?.username ?? '—'}</Text>
        {profile?.home_city ? <Text style={styles.sub}>🏠 {profile.home_city}</Text> : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.saved_places_count ?? 0}</Text>
          <Text style={styles.statLabel}>Saved places</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.trips_count ?? 0}</Text>
          <Text style={styles.statLabel}>Trips planned</Text>
        </View>
      </View>

      <Button title="Sign out" variant="danger" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    gap: 6,
  },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: theme.colors.textDim },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { color: theme.colors.accent, fontSize: 28, fontWeight: '800' },
  statLabel: { color: theme.colors.textDim, marginTop: 4 },
});
