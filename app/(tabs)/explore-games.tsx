import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';

function getScale(width: number) {
  if (width >= 1300) return 1.4;
  if (width >= 1000) return 1.2;
  if (width >= 800)  return 1.05;
  return 1;
}

const GAMES = [
  {
    route: '/memory' as const,
    title: 'Memory Game',
    emoji: '🧩',
    tagline: 'Train your brain!',
    description: 'Flip cards and find all matching pairs!',
    skills: ['Memory', 'Focus', 'Matching'],
    bgColor: '#1565C0',
    borderColor: '#FFD700',
    shadowColor: '#0D47A1',
    locked: false,
  },
  {
    route: '/sorting' as const,
    title: 'Sorting Game',
    emoji: '🗂️',
    tagline: 'Sort it out!',
    description: 'Drop each item into the correct category box!',
    skills: ['Sorting', 'Logic', 'Categories'],
    bgColor: '#E65100',
    borderColor: '#FFD700',
    shadowColor: '#BF360C',
    locked: false,
  },
  {
    route: '/puzzle' as const,
    title: 'Picture Puzzle',
    emoji: '🧩',
    tagline: 'Complete the scene!',
    description: 'Place each missing tile back in the right spot!',
    skills: ['Puzzle', 'Visual', 'Spatial'],
    bgColor: '#37474F',
    borderColor: '#FFD700',
    shadowColor: '#263238',
    locked: false,
  },
  {
    route: '/jigsaw' as const,
    title: 'Jigsaw Puzzle',
    emoji: '🧩',
    tagline: 'Build the scene!',
    description: 'Drag or tap pieces to assemble the full picture!',
    skills: ['Spatial', 'Visual', 'Puzzle'],
    bgColor: '#1A237E',
    borderColor: '#FFD700',
    shadowColor: '#0D1470',
    locked: false,
  },
  {
    route: '/matching' as const,
    title: 'Matching!',
    emoji: '🔗',
    tagline: 'Connect the pairs!',
    description: 'Tap an item and find its match on the other side!',
    skills: ['Matching', 'Logic', 'Memory'],
    bgColor: '#6A1B9A',
    borderColor: '#CE93D8',
    shadowColor: '#4A148C',
    locked: false,
  },
];

export default function ExploreGames() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(GAMES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.78))).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const { width } = dims;
  const scale = getScale(width);
  const isTablet = width >= 800;

  const circleSize = isTablet ? 190 : 138;
  const circleGap = isTablet ? 36 : 24;
  const itemW = circleSize + circleGap;

  const activeGame = GAMES[activeIndex];

  const animateTo = (index: number) => {
    setActiveIndex(index);
    GAMES.forEach((_, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: i === index ? 1 : 0.78,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }).start();
    });
  };

  const onScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / itemW);
    if (index !== activeIndex && index >= 0 && index < GAMES.length) {
      animateTo(index);
    }
  };

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateTo(index);
  };

  const handleCircleTap = (index: number, locked: boolean, route: any) => {
    if (index !== activeIndex) {
      // First tap — just select
      goTo(index);
    } else if (!locked) {
      // Second tap (already active) — navigate
      router.push(route);
    }
  };

  return (
    <View style={styles.screen}>

      {/* ── Header ── */}
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
          <Text style={{ fontSize: 18 * scale, lineHeight: 24 }}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🎮 Explore Games</Text>
          <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>
            Swipe to browse · Tap to select · Tap again to play!
          </Text>
        </View>
        <View style={styles.homeBtn} />
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>

        {/* ── Circle carousel — full width ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={itemW}
          decelerationRate="fast"
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: (width - circleSize) / 2 }]}
        >
          {GAMES.map((game, index) => {
            const isActive = index === activeIndex;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.circleWrapper,
                  { marginRight: circleGap, transform: [{ scale: scaleAnims[index] }] },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleCircleTap(index, game.locked, game.route)}
                  activeOpacity={game.locked ? 0.6 : 0.85}
                  style={[
                    styles.circle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      backgroundColor: game.bgColor,
                      borderColor: isActive ? game.borderColor : 'rgba(255,255,255,0.2)',
                      borderWidth: isActive ? 6 : 2.5,
                      shadowColor: game.shadowColor,
                      opacity: game.locked ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: circleSize * 0.28 }}>{game.emoji}</Text>
                  <Text style={[styles.circleTitle, { fontSize: circleSize * 0.09, color: isActive ? game.borderColor : '#fff' }]} numberOfLines={2}>
                    {game.title}
                  </Text>
                  <Text style={[styles.circleTagline, { fontSize: circleSize * 0.075 }]}>
                    {game.tagline}
                  </Text>

                  {/* Tap-to-play ring indicator on active unlocked */}
                  {isActive && !game.locked && (
                    <View style={styles.playRing}>
                      <Text style={[styles.playRingText, { fontSize: circleSize * 0.075 }]}>▶ Tap to Play!</Text>
                    </View>
                  )}
                  {game.locked && (
                    <View style={styles.lockedBadge}>
                      <Text style={{ fontSize: circleSize * 0.08 }}>🔒</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Active dot below circle */}
                <View style={[styles.activeDot, { backgroundColor: isActive ? game.borderColor : 'transparent' }]} />
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* ── Info card for active game ── */}
        <View style={[styles.infoCard, { borderColor: activeGame.borderColor + '55', backgroundColor: activeGame.bgColor + '22' }]}>
          {/* Skills row */}
          <View style={styles.skillsRow}>
            {activeGame.skills.map((s, i) => (
              <View key={i} style={[styles.skillChip, { backgroundColor: activeGame.bgColor, borderColor: activeGame.borderColor }]}>
                <Text style={[styles.skillText, { fontSize: 10 * scale }]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>{activeGame.description}</Text>

          {/* Dot indicators */}
          <View style={styles.dotsRow}>
            {GAMES.map((g, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
                <View style={[
                  styles.dot,
                  {
                    backgroundColor: i === activeIndex ? activeGame.borderColor : 'rgba(255,255,255,0.3)',
                    width: i === activeIndex ? 22 : 8,
                  },
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    padding: 12,
    gap: 10,
  },
  header: {
    height: 54,
    backgroundColor: '#16213E',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTablet: {
    height: 62,
    borderRadius: 22,
    paddingHorizontal: 20,
  },
  homeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  scrollContent: {
    alignItems: 'center',
  },
  circleWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },
  circleTitle: {
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  circleTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
  },
  playRing: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  playRingText: {
    color: '#fff',
    fontWeight: '800',
  },
  lockedBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Info card
  infoCard: {
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  skillChip: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  skillText: {
    color: '#fff',
    fontWeight: '800',
  },
  infoDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
