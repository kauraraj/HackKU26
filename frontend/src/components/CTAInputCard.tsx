import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Video } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';

interface Props {
  onSubmit: (url: string) => void;
}

export function CTAInputCard({ onSubmit }: Props) {
  const { colors } = useTheme();
  const [url, setUrl] = useState('');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 4,
        },
      ]}
    >
      <View style={styles.headRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentBg }]}>
          <Video size={20} color={colors.primary} />
        </View>
        <View style={styles.headText}>
          <Text style={[styles.headline, { color: colors.foreground }]}>Turn a Video into a Trip</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Paste a TikTok, YouTube, or Reel link
          </Text>
        </View>
      </View>

      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://..."
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
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

      <Button
        title="Generate Trip"
        onPress={() => {
          if (url.trim()) onSubmit(url.trim());
        }}
        disabled={!url.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1, gap: 2 },
  headline: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
});
