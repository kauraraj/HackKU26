import { View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Plus, Calendar, User, Moon, Sun } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export default function TabsLayout() {
  const { isDark, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerRight: () => (
          <Pressable
            onPress={toggleTheme}
            hitSlop={8}
            style={{
              marginRight: 16,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {isDark
              ? <Sun size={18} color={colors.primary} />
              : <Moon size={18} color={colors.primary} />}
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Plus size={26} color="#fff" strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
    </Tabs>
  );
}
