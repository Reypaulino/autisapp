import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  LayoutChangeEvent,
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

const COLS = 4;
const ROWS = 2;
const CARD_GAP = 10;

const GAMES = [
  { emoji: '🧩', name: 'Memory',     bg: '#1565C0', shadow: '#0D47A1', accent: '#FFD700',  route: '/memory' },
  { emoji: '🗂️', name: 'Sorting',    bg: '#D84315', shadow: '#BF360C', accent: '#FFCCBC',  route: '/sorting' },
  { emoji: '🎯', name: 'Puzzle',     bg: '#6A1B9A', shadow: '#4A148C', accent: '#E1BEE7',  route: '/puzzle' },
  { emoji: '🔗', name: 'Matching',   bg: '#C62828', shadow: '#B71C1C', accent: '#FFCDD2',  route: '/matching' },
  { emoji: '🧸', name: 'Jigsaw',     bg: '#00695C', shadow: '#004D40', accent: '#B2DFDB',  route: '/jigsaw' },
  { emoji: '🌈', name: 'Sensory',    bg: '#E65100', shadow: '#BF360C', accent: '#FFE0B2',  route: '/sensory' },
  { emoji: '🎨', name: 'Drawing',    bg: '#AD1457', shadow: '#880E4F', accent: '#F8BBD0',  route: '/drawing' },
  { emoji: '⭐', name: 'Activities', bg: '#4527A0', shadow: '#311B92', accent: '#D1C4E9',  route: '/activities' },
] as const;

type Game = (typeof GAMES)[number];

function GameCard({
  game, cardW, cardH, scale, onPress,
}: {
  game: Game; cardW: number; cardH: number; scale: number; onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(anim, { toValue: 0.91, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const pressOut = () => Animated.spring(anim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: anim }], width: cardW, height: cardH }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: game.bg, borderBottomColor: game.shadow }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        <Text style={{ fontSize: Math.min(cardH * 0.38, 46 * scale) }}>{game.emoji}</Text>
        <Text style={[styles.cardName, { fontSize: Math.max(10, 12 * scale), color: game.accent }]}>
          {game.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [dims, setDims]     = useState(Dimensions.get('window'));
  const [gridSz, setGridSz] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const scale = getScale(dims.width);

  const onGridLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setGridSz({ w: width, h: height });
  };

  // Card sizing: fit COLS×ROWS cards exactly inside the measured grid area
  const HEADER_H = 26;
  const HEADER_GAP = 8;
  const availW = gridSz.w;
  const availH = gridSz.h - HEADER_H - HEADER_GAP;
  const cardW  = availW > 0 ? Math.floor((availW - CARD_GAP * (COLS - 1)) / COLS) : 0;
  const cardH  = availH > 0 ? Math.floor((availH - CARD_GAP * (ROWS - 1)) / ROWS) : 0;

  const brandW = Math.round(dims.width * 0.26);

  return (
    <View style={styles.screen}>

      {/* ── Brand Panel ── */}
      <View style={[styles.brand, { width: brandW }]}>

        {/* Top decorative stars */}
        <View style={styles.starsRow}>
          {['✨', '⭐', '✨'].map((s, i) => (
            <Text key={i} style={[styles.starText, { fontSize: 14 * scale }]}>{s}</Text>
          ))}
        </View>

        {/* Logo with glow ring */}
        <View style={styles.logoRing}>
          <Image
            source={require('@/assets/logo.png')}
            style={{ width: 96 * scale, height: 96 * scale, borderRadius: 20 * scale }}
            resizeMode="contain"
          />
        </View>

        {/* Name */}
        <Text style={[styles.brandName, { fontSize: 22 * scale }]}>ThinkiTiles</Text>

        {/* Tagline */}
        <Text style={[styles.brandTagline, { fontSize: 10 * scale }]}>
          LEARN · PLAY · GROW
        </Text>

        {/* Divider line */}
        <View style={styles.brandDivider} />

        {/* Stats chips */}
        <View style={styles.statsRow}>
          <View style={styles.chip}>
            <Text style={[styles.chipNum, { fontSize: 17 * scale }]}>9</Text>
            <Text style={[styles.chipLbl, { fontSize: 8 * scale }]}>GAMES</Text>
          </View>
          <View style={[styles.chip, styles.chipGold]}>
            <Text style={[styles.chipNum, { fontSize: 17 * scale, color: '#0A1628' }]}>🆓</Text>
            <Text style={[styles.chipLbl, { fontSize: 8 * scale, color: '#0A1628' }]}>FREE</Text>
          </View>
        </View>

      </View>

      {/* ── Separator ── */}
      <View style={styles.sep} />

      {/* ── Game Grid ── */}
      <View style={styles.gridWrap} onLayout={onGridLayout}>

        <Text style={[styles.gridHeader, { fontSize: 10 * scale }]}>
          ▶  CHOOSE YOUR GAME
        </Text>

        {cardW > 0 && cardH > 0 && (
          <View style={[styles.grid, { gap: CARD_GAP }]}>
            {GAMES.map(g => (
              <GameCard
                key={g.route}
                game={g}
                cardW={cardW}
                cardH={cardH}
                scale={scale}
                onPress={() => router.push(g.route as any)}
              />
            ))}
          </View>
        )}

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A1628',
    flexDirection: 'row',
    padding: 14,
    gap: 14,
  },

  // ── Brand panel ──
  brand: {
    backgroundColor: '#111F3E',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starText: {
    opacity: 0.7,
  },
  logoRing: {
    borderRadius: 28,
    padding: 5,
    backgroundColor: 'rgba(79, 195, 247, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(79, 195, 247, 0.35)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  brandName: {
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandTagline: {
    color: '#90CAF9',
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandDivider: {
    width: '60%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    marginVertical: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 48,
  },
  chipGold: {
    backgroundColor: '#FFD700',
    borderColor: '#FFC107',
  },
  chipNum: {
    fontWeight: '900',
    color: '#fff',
    lineHeight: 22,
  },
  chipLbl: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Separator ──
  sep: {
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    marginVertical: 6,
  },

  // ── Grid area ──
  gridWrap: {
    flex: 1,
  },
  gridHeader: {
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
    height: 26,
    textAlignVertical: 'center',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // ── Game card ──
  card: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderBottomWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardName: {
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
