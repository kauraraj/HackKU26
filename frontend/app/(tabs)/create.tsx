import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function CreateScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Create coming soon</Text>
    </View>
  );
}
