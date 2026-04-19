import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Link2, Wand2, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useTheme } from '@/context/ThemeContext';
import { createIngestion } from '@/services/ingestions';
import type { Colors } from '@/context/ThemeContext';

const EXAMPLE_LINKS: { handle: string; label: string; url: string }[] = [
  {
    handle: '@kara.travels',
    label: 'Kyoto in 48 hours',
    url: 'https://www.tiktok.com/@kara.travels/video/7298471203948571423',
  },
  {
    handle: '@matt.eats',
    label: 'Lisbon food crawl',
    url: 'https://www.tiktok.com/@matt.eats/video/7311029834716183822',
  },
  {
    handle: '@nomadnina',
    label: 'Mexico City weekend',
    url: 'https://www.tiktok.com/@nomadnina/video/7326104492013845671',
  },
];

const HOW_IT_WORKS: { icon: typeof Link2; title: string; body: string }[] = [
  { icon: Link2, title: 'Paste', body: 'Drop in any TikTok, Reel, or Short.' },
  { icon: Wand2, title: 'Extract', body: 'AI pulls every place the creator mentions.' },
  { icon: CheckCircle2, title: 'Confirm', body: 'Review picks, save them to a trip.' },
];

export default function CreateScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const submit = async (override?: string) => {
    const trimmed = (override ?? url).trim();
    if (!trimmed) {
      setError('Paste a video link to get started.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const job = await createIngestion(trimmed);
      setUrl('');
      router.push(`/ingestion/${job.id}` as never);
    } catch (e) {
      setError((e as Error).message ?? 'Could not start. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.iconChip}>
          <Sparkles size={22} color={colors.primary} />
        </View>
        <Text style={styles.title}>Create a Trip</Text>
        <Text style={styles.subtitle}>
          Turn any travel video into a saved itinerary in seconds.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Video link</Text>
        <TextInput
          value={url}
          onChangeText={(v) => {
            setUrl(v);
            if (error) setError(null);
          }}
          placeholder="https://tiktok.com/@creator/video/..."
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!submitting}
          style={styles.input}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button
          title={submitting ? 'Generating…' : 'Generate Trip'}
          onPress={() => submit()}
          loading={submitting}
          disabled={!url.trim() && !submitting}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Try one of these</Text>
        {EXAMPLE_LINKS.map((ex) => (
          <Pressable
            key={ex.url}
            onPress={() => {
              setUrl(ex.url);
              setError(null);
            }}
            disabled={submitting}
            style={({ pressed }) => [
              styles.exampleRow,
              pressed && !submitting && { opacity: 0.7 },
            ]}
          >
            <View style={styles.exampleThumb}>
              <Text style={styles.exampleThumbText}>
                {ex.handle.replace('@', '').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.exampleText}>
              <Text style={styles.exampleLabel}>{ex.label}</Text>
              <Text style={styles.exampleHandle}>{ex.handle}</Text>
            </View>
            <ArrowRight size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>
        {HOW_IT_WORKS.map((step, i) => {
          const Icon = step.icon;
          return (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Icon size={18} color={colors.primary} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>
                  {i + 1}. {step.title}
                </Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    hero: { gap: 10, alignItems: 'flex-start' },
    iconChip: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentBg,
    },
    title: { fontSize: 28, fontWeight: '800', color: colors.foreground },
    subtitle: { fontSize: 15, lineHeight: 21, color: colors.mutedForeground },

    card: {
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.card,
      padding: 16,
      gap: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 4,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mutedForeground,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      color: colors.foreground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    errorText: { fontSize: 13, color: colors.destructive },

    section: { gap: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground },

    exampleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    exampleThumb: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accentBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exampleThumbText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accentFg,
      letterSpacing: 0.5,
    },
    exampleText: { flex: 1, gap: 2 },
    exampleLabel: { fontSize: 15, fontWeight: '600', color: colors.foreground },
    exampleHandle: { fontSize: 13, color: colors.mutedForeground },

    stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    stepIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepText: { flex: 1, gap: 2 },
    stepTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
    stepBody: { fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  });
}
