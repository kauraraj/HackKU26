import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="[username]" options={{ title: 'Profile' }} />
    </Stack>
  );
}
