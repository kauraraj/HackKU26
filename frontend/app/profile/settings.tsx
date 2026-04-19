import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Moon, Sun, LogOut, Shield, Eye } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getPrivacySettings, updatePrivacySettings } from '@/services/social';
import type { PrivacySettings, ProfileVisibility } from '@/types/social';
import type { Colors } from '@/context/ThemeContext';

const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Only me' },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    getPrivacySettings().then(setPrivacy);
  }, []);

  const setVisibility = useCallback(
    async (key: keyof PrivacySettings, value: ProfileVisibility) => {
      const next = await updatePrivacySettings({ [key]: value });
      setPrivacy(next);
    },
    []
  );

  return (
    <Screen scroll>
      <Section title="Privacy" icon={<Shield size={16} color={colors.primary} />} colors={colors}>
        <VisibilityRow
          label="History"
          helper="Who can see your past trips and posted itineraries"
          value={privacy?.history_visibility ?? 'friends'}
          onChange={(v) => setVisibility('history_visibility', v)}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <VisibilityRow
          label="Saved"
          helper="Who can see places and itineraries you save"
          value={privacy?.saved_visibility ?? 'private'}
          onChange={(v) => setVisibility('saved_visibility', v)}
          colors={colors}
        />
      </Section>

      <Section title="Appearance" icon={<Eye size={16} color={colors.primary} />} colors={colors}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Dark mode</Text>
            <Text style={[styles.rowHelper, { color: colors.mutedForeground }]}>
              Match system or override here
            </Text>
          </View>
          <View style={styles.themeBadge}>
            {isDark ? <Moon size={16} color={colors.primary} /> : <Sun size={16} color={colors.primary} />}
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.card}
            />
          </View>
        </View>
      </Section>

      <Pressable
        onPress={signOut}
        style={({ pressed }) => [
          styles.signOut,
          { backgroundColor: colors.destructive },
          pressed && { opacity: 0.9 },
        ]}
        hitSlop={4}
      >
        <LogOut size={18} color="#fff" />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  colors: Colors;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

function VisibilityRow({
  label,
  helper,
  value,
  onChange,
  colors,
}: {
  label: string;
  helper: string;
  value: ProfileVisibility;
  onChange: (v: ProfileVisibility) => void;
  colors: Colors;
}) {
  return (
    <View style={styles.visRow}>
      <View style={{ gap: 2 }}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowHelper, { color: colors.mutedForeground }]}>{helper}</Text>
      </View>
      <View style={[styles.visChips, { backgroundColor: colors.secondary }]}>
        {VISIBILITY_OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.visChip,
                active && { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.visChipText,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  sectionBody: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowHelper: { fontSize: 12, marginTop: 2 },
  themeBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  visRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  visChips: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  visChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  visChipText: { fontSize: 12, fontWeight: '600' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
