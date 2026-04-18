import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { theme } from '@/components/theme';
import { createIngestion } from '@/services/ingestions';

export default function NewIngestion() {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      <Text style={styles.title}>Turn this TikTok into a trip ✨</Text>
      <Text style={styles.body}>
        Paste a TikTok link below. We&apos;ll scan the video for places the creator mentions, then hand them to you
        to confirm.
      </Text>
      <TextInput
        placeholder="https://tiktok.com/@creator/video/..."
        placeholderTextColor={theme.colors.textDim}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
        style={styles.input}
      />
      <Button title="Extract places" onPress={submit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '800' },
  body: { color: theme.colors.textDim, lineHeight: 20 },
  input: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 14,
    color: theme.colors.text,
    fontSize: 16,
  },
});
