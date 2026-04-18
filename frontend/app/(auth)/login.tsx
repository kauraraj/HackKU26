import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { theme } from '@/components/theme';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign-in failed', error.message);
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.logo}>✈️ TripCreator</Text>
        <Text style={styles.tagline}>Turn TikToks into trips.</Text>
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor={theme.colors.textDim}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={theme.colors.textDim}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button title="Log in" onPress={submit} loading={loading} />
      <Button title="Create account" variant="ghost" onPress={() => router.push('/(auth)/signup')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginVertical: 48, gap: 6 },
  logo: { fontSize: 34, fontWeight: '800', color: theme.colors.text },
  tagline: { color: theme.colors.textDim, fontSize: 16 },
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
