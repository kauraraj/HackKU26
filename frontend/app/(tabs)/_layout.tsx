import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '@/components/theme';

function Icon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.colors.bgElevated, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textDim,
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Saved', tabBarIcon: ({ focused }) => <Icon label="📍" focused={focused} /> }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: 'Trips', tabBarIcon: ({ focused }) => <Icon label="🗺️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarIcon: ({ focused }) => <Icon label="🌍" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Me', tabBarIcon: ({ focused }) => <Icon label="🙂" focused={focused} /> }}
      />
    </Tabs>
  );
}
