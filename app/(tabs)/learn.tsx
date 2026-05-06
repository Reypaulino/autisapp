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

const SECTIONS = [
  {
    route: '/activities' as const,
    title: 'Activities',
    emoji: '🎯',
    tagline: 'Learn by doing!',
    description: 'Guided activities for movement, language, maths & more! 12 activities across 8 categories.',
    skills: ['Movement', 'Language', 'Cognitive'],
    bgColor: '#FF6F00',
    borderColor: '#FFD700',
    shadowColor: '#E65100',
  },
  {
    route: '/sensory' as const,
    title: 'Sensory Play',
    emoji: '🌈',
    tagline: 'Explore your senses!',
    description: 'Touch, sight, sound & smell play to calm, engage and regulate. Calm, moderate and active options.',
    skills: ['Touch', 'Visual', 'Regulation'],
    bgColor: '#6A1B9A',
    borderColor: '#CE93D8',
    shadowColor: '#4A148C',
  },
  {
    route: '/coloring' as const,
    title: 'Animal Colouring',
    emoji: '🎨',
    tagline: 'Colour the animals!',
    description: 'Tap any part of 8 beautiful animals and fill them with colour! Great for creativity and fine motor skills.',
    skills: ['Art', 'Creativity', 'Fine Motor'],
    bgColor: '#AD1457',
    borderColor: '#F48FB1',
    shadowColor: '#880E4F',
  },
  {
    route: '/coloring-vehicles' as const,
    title: 'Vehicle Colouring',
    emoji: '🚗',
    tagline: 'Colour the vehicles!',
    description: 'Tap and colour 8 vehicles — car, bus, plane, train, rocket, helicopter, ship & race car!',
    skills: ['Art', 'Vehicles', 'Fine Motor'],
    bgColor: '#0277BD',
    borderColor: '#81D4FA',
    shadowColor: '#01579B',
  },
];

const LOCKED = new Set<string>(['Coming Soon']);

export default function LearnHub() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(SECTIONS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.78))).current;

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
  const active = SECTIONS[activeIndex];
  const locked = LOCKED.has(active.title);

  const animateTo = (index: number) => {
    setActiveIndex(index);
    SECTIONS.forEach((_, i) => {
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
    if (index !== activeIndex && index >= 0 && index < SECTIONS.length) animateTo(index);
  };

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateTo(index);
  };

  const handleTap = (index: number) => {
    if (index !== activeIndex) {
      goTo(index);
    } else if (!LOCKED.has(SECTIONS[index].title)) {
      router.push(SECTIONS[index].route);
    }
  };

  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
          <Text style={{ fontSize: 18 * scale }}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>📚 Learn & Play</Text>
          <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>
            Swipe to browse · Tap to select · Tap again to open!
          </Text>
        </View>
        <View style={styles.homeBtn} />
      </View>

      {/* Body */}
      <View style={styles.body}>

        {/* Circle carousel */}
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
          {SECTIONS.map((sec, index) => {
            const isActive = index === activeIndex;
            const isLocked = LOCKED.has(sec.title);
            return (
              <Animated.View
                key={index}
                style={[styles.circleWrapper, { marginRight: circleGap, transform: [{ scale: scaleAnims[index] }] }]}
              >
                <TouchableOpacity
                  onPress={() => handleTap(index)}
                  activeOpacity={isLocked ? 0.6 : 0.85}
                  style={[
                    styles.circle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      backgroundColor: sec.bgColor,
                      borderColor: isActive ? sec.borderColor : 'rgba(255,255,255,0.2)',
                      borderWidth: isActive ? 6 : 2.5,
                      shadowColor: sec.shadowColor,
                      opacity: isLocked ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: circleSize * 0.28 }}>{sec.emoji}</Text>
                  <Text style={[styles.circleTitle, { fontSize: circleSize * 0.09, color: isActive ? sec.borderColor : '#fff' }]} numberOfLines={2}>
                    {sec.title}
                  </Text>
                  <Text style={[styles.circleTagline, { fontSize: circleSize * 0.075 }]}>
                    {sec.tagline}
                  </Text>
                  {isActive && !isLocked && (
                    <View style={styles.openRing}>
                      <Text style={[styles.openRingText, { fontSize: circleSize * 0.075 }]}>▶ Tap to Open!</Text>
                    </View>
                  )}
                  {isLocked && (
                    <View style={styles.lockedBadge}>
                      <Text style={{ fontSize: circleSize * 0.08 }}>🔒</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={[styles.activeDot, { backgroundColor: isActive ? sec.borderColor : 'transparent' }]} />
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Info card */}
        <View style={[styles.infoCard, { borderColor: active.borderColor + '55', backgroundColor: active.bgColor + '22' }]}>
          <View style={styles.skillsRow}>
            {active.skills.map((s, i) => (
              <View key={i} style={[styles.skillChip, { backgroundColor: active.bgColor, borderColor: active.borderColor }]}>
                <Text style={[styles.skillText, { fontSize: 10 * scale }]}>{s}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>{active.description}</Text>
          {!locked && (
            <TouchableOpacity
              style={[styles.goBtn, { backgroundColor: active.bgColor, borderColor: active.borderColor }]}
              onPress={() => router.push(active.route)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 18 * scale }}>{active.emoji}</Text>
              <Text style={[styles.goBtnText, { fontSize: 14 * scale }]}>Open {active.title}!</Text>
            </TouchableOpacity>
          )}
          <View style={styles.dotsRow}>
            {SECTIONS.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
                <View style={[styles.dot, {
                  backgroundColor: i === activeIndex ? active.borderColor : 'rgba(255,255,255,0.3)',
                  width: i === activeIndex ? 22 : 8,
                }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A1A2E', padding: 12, gap: 10 },
  header: {
    height: 54, backgroundColor: '#16213E', borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTablet: { height: 62, borderRadius: 22, paddingHorizontal: 20 },
  homeBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: '900', color: '#FFD700', letterSpacing: 0.3 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 1 },
  body: { flex: 1, justifyContent: 'space-between', gap: 10 },
  scrollContent: { alignItems: 'center' },
  circleWrapper: { alignItems: 'center', gap: 8 },
  circle: {
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 14, elevation: 14,
  },
  circleTitle: { fontWeight: '900', textAlign: 'center', paddingHorizontal: 10 },
  circleTagline: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'center' },
  openRing: {
    marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  openRingText: { color: '#fff', fontWeight: '800' },
  lockedBadge: {
    marginTop: 4, backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  infoCard: {
    borderRadius: 20, borderWidth: 2,
    paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', gap: 10,
  },
  skillsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  skillChip: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 5 },
  skillText: { color: '#fff', fontWeight: '800' },
  infoDesc: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', textAlign: 'center' },
  goBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, borderWidth: 2.5, paddingHorizontal: 22, paddingVertical: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  goBtnText: { color: '#FFD700', fontWeight: '900' },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
