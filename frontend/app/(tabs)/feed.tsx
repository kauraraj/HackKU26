import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function FeedScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Feed coming soon</Text>
    </View>
  );
}
