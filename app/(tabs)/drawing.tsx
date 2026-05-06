import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

function getScale(w: number) {
  if (w >= 1300) return 1.3;
  if (w >= 1000) return 1.15;
  if (w >= 800)  return 1.0;
  return 0.85;
}

const OPTIONS = [
  {
    emoji: '🦁',
    title: 'Animals',
    sub: 'Colour cats, dogs, birds & more',
    bg: '#2E7D32',
    shadow: '#1B5E20',
    accent: '#C8E6C9',
    route: '/coloring',
  },
  {
    emoji: '🚗',
    title: 'Vehicles',
    sub: 'Colour cars, trucks, planes & more',
    bg: '#0277BD',
    shadow: '#01579B',
    accent: '#B3E5FC',
    route: '/coloring-vehicles',
  },
] as const;

function DrawCard({
  opt, cardH, scale, onPress,
}: {
  opt: (typeof OPTIONS)[number];
  cardH: number;
  scale: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(anim, { toValue: 0.93, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const pressOut = () => Animated.spring(anim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: anim }], height: cardH }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: opt.bg, borderBottomColor: opt.shadow }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        <Text style={{ fontSize: 64 * scale }}>{opt.emoji}</Text>
        <Text style={[styles.cardTitle, { fontSize: 22 * scale, color: opt.accent }]}>
          {opt.title}
        </Text>
        <Text style={[styles.cardSub, { fontSize: 12 * scale }]}>
          {opt.sub}
        </Text>
        <View style={[styles.playBtn, { backgroundColor: opt.accent }]}>
          <Text style={[styles.playBtnText, { fontSize: 13 * scale, color: opt.bg }]}>
            ▶  Start Drawing
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DrawingScreen() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const scale = getScale(dims.width);
  const pad = 20;
  const headerH = 56;
  const cardH = dims.height - pad * 2 - headerH - 16;

  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')} activeOpacity={0.8}>
          <Text style={[styles.backText, { fontSize: 14 * scale }]}>← Home</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { fontSize: 20 * scale }]}>🎨  Drawing Games</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Two drawing cards */}
      <View style={[styles.row, { gap: 16, paddingHorizontal: pad }]}>
        {OPTIONS.map(opt => (
          <DrawCard
            key={opt.route}
            opt={opt}
            cardH={cardH}
            scale={scale}
            onPress={() => router.push(opt.route)}
          />
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A1628',
    paddingVertical: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 40,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backText: {
    color: '#90CAF9',
    fontWeight: '700',
  },
  heading: {
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderBottomWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
    paddingHorizontal: 24,
  },
  cardTitle: {
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardSub: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    textAlign: 'center',
  },
  playBtn: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  playBtnText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
