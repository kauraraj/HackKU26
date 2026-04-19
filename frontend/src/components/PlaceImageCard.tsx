import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  name: string;
  category?: string;
  short_description?: string | null;
  trending_count: number;
  visit_count: number;
  onPress?: () => void;
  trailing?: React.ReactNode;
}

const GRADIENTS: [string, string][] = [
  ['#0ea5e9', '#6366f1'],
  ['#f43f5e', '#f97316'],
  ['#10b981', '#0891b2'],
  ['#8b5cf6', '#ec4899'],
  ['#f59e0b', '#ef4444'],
];

function pickGradient(name: string): [string, string] {
  const code = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return GRADIENTS[code % GRADIENTS.length];
}

export function PlaceImageCard({ name, category, short_description, trending_count, visit_count, onPress, trailing }: Props) {
  const { colors } = useTheme();
  const grad = pickGradient(name);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && { opacity: 0.9 },
      ]}
    >
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.image}
      >
        <View style={styles.imageOverlay}>
          <Text style={styles.imageName} numberOfLines={2}>{name}</Text>
          {category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.meta}>
        <View style={styles.stat}>
          <TrendingUp size={12} color={colors.warn} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            {formatCount(trending_count)} trending
          </Text>
        </View>
        <View style={styles.stat}>
          <Users size={12} color={colors.mutedForeground} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            {formatCount(visit_count)} visits
          </Text>
        </View>
        {short_description ? (
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {short_description}
          </Text>
        ) : null}
        {trailing}
      </View>
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: { height: 140 },
  imageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  imageName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  meta: { padding: 12, gap: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, fontWeight: '500' },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
