import { StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, subtitle, action }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  subtitle: { color: theme.colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: 16, alignSelf: 'stretch' },
});
