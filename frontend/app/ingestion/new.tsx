import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useTheme } from '@/context/ThemeContext';
import { createIngestion } from '@/services/ingestions';

export default function NewIngestion() {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { colors } = useTheme();
  const router = useRouter();

  const submit = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Paste a TikTok URL to get started.');
      return;
    }
    setSubmitting(true);
    try {
      const job = await createIngestion(trimmed);
      router.replace(`/ingestion/${job.id}`);
    } catch (e) {
      Alert.alert('Could not start ingestion', (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: colors.foreground }]}>Turn this TikTok into a trip</Text>
      <View style={[styles.iconWrap, { backgroundColor: colors.accentBg }]}>
        <Sparkles size={24} color={colors.primary} />
      </View>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Paste a TikTok link below. We&apos;ll scan the video for places the creator mentions, then hand them to you
        to confirm.
      </Text>
      <TextInput
        placeholder="https://tiktok.com/@creator/video/..."
        placeholderTextColor={colors.mutedForeground}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
      <Button title="Extract places" onPress={submit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800' },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
});
