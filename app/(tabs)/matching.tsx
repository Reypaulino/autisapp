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
import { useAudioPlayer } from 'expo-audio';

const SND_CORRECT = require('@/assets/sounds/correct.wav');
const SND_WRONG   = require('@/assets/sounds/wrong.wav');
const SND_WIN     = require('@/assets/sounds/win.wav');
function playSound(p: ReturnType<typeof useAudioPlayer>) { try { p.seekTo(0); p.play(); } catch (_) {} }

// ── Types ─────────────────────────────────────────────────────────────────────
type MatchPair = { left: string; right: string };

type MatchCategory = {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  tagline: string;
  pairs: MatchPair[];
  pairColors: string[];
};

type MatchLevel = {
  level: number;
  label: string;
  pairs: number;
  difficulty: string;
  color: string;
};

type Side = 'left' | 'right';

type SlotState = {
  index: number;
  matched: boolean;
  colorIndex: number;
};

// ── Levels ────────────────────────────────────────────────────────────────────
const MATCH_LEVELS: MatchLevel[] = [
  { level: 1, label: 'Beginner', pairs: 3, difficulty: '⭐☆☆☆☆', color: '#4CAF50' },
  { level: 2, label: 'Easy',     pairs: 4, difficulty: '⭐⭐☆☆☆', color: '#8BC34A' },
  { level: 3, label: 'Medium',   pairs: 5, difficulty: '⭐⭐⭐☆☆', color: '#FF9800' },
  { level: 4, label: 'Hard',     pairs: 6, difficulty: '⭐⭐⭐⭐☆', color: '#FF5722' },
  { level: 5, label: 'Expert',   pairs: 7, difficulty: '⭐⭐⭐⭐⭐', color: '#E53935' },
];

// ── Categories ────────────────────────────────────────────────────────────────
const MATCH_CATEGORIES: MatchCategory[] = [
  {
    id: 'baby_adult',
    label: 'Baby & Grown-Up',
    icon: '🐣',
    bgColor: '#FF8C42',
    borderColor: '#FFD700',
    shadowColor: '#E65100',
    tagline: 'Match babies to adults!',
    pairs: [
      { left: '🐣', right: '🐔' },
      { left: '🐱', right: '🦁' },
      { left: '🌱', right: '🌳' },
      { left: '🐛', right: '🦋' },
      { left: '🥚', right: '🐊' },
      { left: '🐸', right: '🐸' },
      { left: '🦆', right: '🦅' },
    ],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#FF9FF3','#54A0FF','#A29BFE'],
  },
  {
    id: 'animal_home',
    label: 'Animal Homes',
    icon: '🏠',
    bgColor: '#2E7D32',
    borderColor: '#FFEB3B',
    shadowColor: '#1B5E20',
    tagline: 'Match animals to their homes!',
    pairs: [
      { left: '🐠', right: '🌊' },
      { left: '🐦', right: '🪺' },
      { left: '🐝', right: '🍯' },
      { left: '🐇', right: '🕳️' },
      { left: '🐻', right: '🌲' },
      { left: '🐢', right: '🏖️' },
      { left: '🦉', right: '🌙' },
    ],
    pairColors: ['#48DBFB','#FECA57','#FF9F43','#A29BFE','#1DD1A1','#FF9FF3','#54A0FF'],
  },
  {
    id: 'food_color',
    label: 'Food & Color',
    icon: '🎨',
    bgColor: '#1565C0',
    borderColor: '#FFD700',
    shadowColor: '#0D47A1',
    tagline: 'Match food to its color!',
    pairs: [
      { left: '🍎', right: '🔴' },
      { left: '🍊', right: '🟠' },
      { left: '🍋', right: '🟡' },
      { left: '🥦', right: '🟢' },
      { left: '🫐', right: '🔵' },
      { left: '🍇', right: '🟣' },
      { left: '🍫', right: '🟤' },
    ],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#1DD1A1','#48DBFB','#A29BFE','#54A0FF'],
  },
  {
    id: 'weather_clothes',
    label: 'Weather & Clothes',
    icon: '🌤️',
    bgColor: '#4527A0',
    borderColor: '#CE93D8',
    shadowColor: '#311B92',
    tagline: 'Dress for the weather!',
    pairs: [
      { left: '☀️', right: '🩳' },
      { left: '🌧️', right: '☂️' },
      { left: '❄️', right: '🧥' },
      { left: '🌬️', right: '🧣' },
      { left: '🏖️', right: '👙' },
      { left: '⛷️', right: '🥶' },
      { left: '🌈', right: '🥾' },
    ],
    pairColors: ['#FECA57','#48DBFB','#A29BFE','#FF9FF3','#FF9F43','#1DD1A1','#FF6B6B'],
  },
  {
    id: 'tool_job',
    label: 'Tools & Jobs',
    icon: '🔧',
    bgColor: '#AD1457',
    borderColor: '#FFD700',
    shadowColor: '#880E4F',
    tagline: 'Match the tool to the job!',
    pairs: [
      { left: '🔧', right: '🔩' },
      { left: '🎨', right: '🖌️' },
      { left: '📚', right: '🎓' },
      { left: '🍳', right: '👨‍🍳' },
      { left: '💊', right: '🩺' },
      { left: '🎸', right: '🎵' },
      { left: '⚽', right: '🏟️' },
    ],
    pairColors: ['#FF6B6B','#FECA57','#54A0FF','#FF9F43','#1DD1A1','#A29BFE','#48DBFB'],
  },
  {
    id: 'number_things',
    label: 'Numbers & Things',
    icon: '🔢',
    bgColor: '#00695C',
    borderColor: '#FFD700',
    shadowColor: '#004D40',
    tagline: 'Match the number to the group!',
    pairs: [
      { left: '1️⃣', right: '🌙' },
      { left: '2️⃣', right: '👀' },
      { left: '3️⃣', right: '🍀' },
      { left: '4️⃣', right: '🍀' },
      { left: '5️⃣', right: '✋' },
      { left: '6️⃣', right: '🎲' },
      { left: '7️⃣', right: '🌈' },
    ],
    pairColors: ['#FF6B6B','#48DBFB','#1DD1A1','#FECA57','#FF9F43','#A29BFE','#54A0FF'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getScale(w: number) {
  if (w >= 1300) return 1.35;
  if (w >= 1000) return 1.15;
  if (w >= 800)  return 1.0;
  return 0.85;
}

const PAD = 12;
const HDR = 52;
const HINT = 36;

// ── Component ─────────────────────────────────────────────────────────────────
export default function MatchingGame() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const correctPlayer = useAudioPlayer(SND_CORRECT);
  const wrongPlayer   = useAudioPlayer(SND_WRONG);
  const winPlayer     = useAudioPlayer(SND_WIN);
  const [selectedCat, setSelectedCat] = useState<MatchCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<MatchLevel | null>(null);
  const [activeCircle, setActiveCircle] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(
    MATCH_CATEGORIES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.8)),
  ).current;

  // Game state
  // leftItems: ordered slice of pairs (left emoji)
  // rightItems: shuffled slice (right emoji) with their original pair index
  const [leftItems, setLeftItems] = useState<{ emoji: string; pairIndex: number }[]>([]);
  const [rightItems, setRightItems] = useState<{ emoji: string; pairIndex: number }[]>([]);
  const [leftStates, setLeftStates] = useState<SlotState[]>([]);
  const [rightStates, setRightStates] = useState<SlotState[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [wrongPair, setWrongPair] = useState<{ l: number; r: number } | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const { width, height } = dims;
  const scale = getScale(width);
  const isTablet = width >= 800;
  const circleSize = isTablet ? 150 : 110;
  const circleGap = isTablet ? 28 : 18;
  const itemW = circleSize + circleGap;

  // ── Carousel helpers ───────────────────────────────────────────────────────
  const animateTo = (index: number) => {
    setActiveCircle(index);
    MATCH_CATEGORIES.forEach((_, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: i === index ? 1 : 0.8,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }).start();
    });
  };

  const onCarouselScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / itemW);
    if (index !== activeCircle && index >= 0 && index < MATCH_CATEGORIES.length) animateTo(index);
  };

  const goToCircle = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateTo(index);
  };

  // ── Game helpers ───────────────────────────────────────────────────────────
  const startGame = (cat: MatchCategory, lv: MatchLevel) => {
    const chosen = cat.pairs.slice(0, lv.pairs);
    const lefts = chosen.map((p, i) => ({ emoji: p.left, pairIndex: i }));
    const rights = shuffle(chosen.map((p, i) => ({ emoji: p.right, pairIndex: i })));
    setSelectedCat(cat);
    setSelectedLevel(lv);
    setLeftItems(lefts);
    setRightItems(rights);
    setLeftStates(lefts.map((_, i) => ({ index: i, matched: false, colorIndex: -1 })));
    setRightStates(rights.map((_, i) => ({ index: i, matched: false, colorIndex: -1 })));
    setSelectedLeft(null);
    setSelectedRight(null);
    setErrors(0);
    setWrongPair(null);
    setFeedback(null);
  };

  const backToCategories = () => { setSelectedCat(null); setSelectedLevel(null); };
  const backToLevels = () => { setSelectedLevel(null); };

  const nextLevel = () => {
    if (!selectedCat || !selectedLevel) return;
    const next = MATCH_LEVELS.find(l => l.level === selectedLevel.level + 1);
    if (next) startGame(selectedCat, next);
  };

  const matchCount = leftStates.filter(s => s.matched).length;
  const totalPairs = selectedLevel?.pairs ?? 0;
  const won = matchCount === totalPairs && totalPairs > 0;
  const isLastLevel = selectedLevel?.level === MATCH_LEVELS.length;

  useEffect(() => {
    if (!won || !selectedLevel || !selectedCat) return;
    playSound(winPlayer);
    if (isLastLevel) {
      const t = setTimeout(() => backToCategories(), 2000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => nextLevel(), 1500);
    return () => clearTimeout(t);
  }, [won]);

  const showFeedback = (text: string, ok: boolean) => {
    setFeedback({ text, ok });
    setTimeout(() => setFeedback(null), 700);
  };

  // Tap left item
  const handleLeftPress = (i: number) => {
    if (leftStates[i].matched) return;
    setSelectedLeft(prev => (prev === i ? null : i));
    setSelectedRight(null);
  };

  // Tap right item
  const handleRightPress = (i: number) => {
    if (rightStates[i].matched) return;
    if (selectedLeft === null) {
      setSelectedRight(prev => (prev === i ? null : i));
      return;
    }
    // We have a left selected — try to match
    const lPairIndex = leftItems[selectedLeft].pairIndex;
    const rPairIndex = rightItems[i].pairIndex;

    if (lPairIndex === rPairIndex) {
      // Correct
      playSound(correctPlayer);
      const colorIndex = lPairIndex;
      setLeftStates(prev => prev.map((s, idx) => idx === selectedLeft ? { ...s, matched: true, colorIndex } : s));
      setRightStates(prev => prev.map((s, idx) => idx === i ? { ...s, matched: true, colorIndex } : s));
      setSelectedLeft(null);
      setSelectedRight(null);
      showFeedback('Perfect match! 🌟', true);
    } else {
      // Wrong
      playSound(wrongPlayer);
      setErrors(e => e + 1);
      setWrongPair({ l: selectedLeft, r: i });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
      showFeedback('Not quite — try again! 😊', false);
    }
  };

  // Also support selecting right first, then left
  useEffect(() => {
    if (selectedRight === null || selectedLeft !== null) return;
    // right is pre-selected, waiting for left
  }, [selectedRight]);

  const handleLeftPressWithRightSelected = (i: number) => {
    if (leftStates[i].matched) return;
    if (selectedRight !== null) {
      const lPairIndex = leftItems[i].pairIndex;
      const rPairIndex = rightItems[selectedRight].pairIndex;
      if (lPairIndex === rPairIndex) {
        playSound(correctPlayer);
        const colorIndex = lPairIndex;
        setLeftStates(prev => prev.map((s, idx) => idx === i ? { ...s, matched: true, colorIndex } : s));
        setRightStates(prev => prev.map((s, idx) => idx === selectedRight ? { ...s, matched: true, colorIndex } : s));
        setSelectedLeft(null);
        setSelectedRight(null);
        showFeedback('Perfect match! 🌟', true);
      } else {
        playSound(wrongPlayer);
        setErrors(e => e + 1);
        setWrongPair({ l: i, r: selectedRight });
        setTimeout(() => {
          setWrongPair(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 600);
        showFeedback('Not quite — try again! 😊', false);
      }
    } else {
      setSelectedLeft(prev => (prev === i ? null : i));
    }
  };

  // ── Sizing ─────────────────────────────────────────────────────────────────
  const gameBodyH = height - PAD * 2 - HDR - HINT - 8 * 3;
  const maxRows = totalPairs || 7;
  const rowH = Math.min(Math.floor(gameBodyH / maxRows) - 6, isTablet ? 80 : 62);
  const emojiSize = rowH * 0.52;

  // ── CATEGORY PICKER ────────────────────────────────────────────────────────
  if (!selectedCat) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { backgroundColor: '#6A1B9A' }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={{ fontSize: 18 * scale }}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🔗 Matching!</Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose a category to play!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.pickerBody}>
          <View style={[styles.infoPanel, { backgroundColor: '#6A1B9A' }]}>
            <Text style={{ fontSize: 52 * scale }}>🔗</Text>
            <Text style={[styles.infoTitle, { fontSize: 18 * scale }]}>Matching!</Text>
            <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>
              Tap an item on the left,{'\n'}then tap its match on the right!{'\n'}5 levels of challenge! ⭐
            </Text>
            <View style={styles.infoBadges}>
              {['Matching', 'Logic', 'Memory'].map(b => (
                <View key={b} style={styles.infoBadge}>
                  <Text style={[styles.infoBadgeText, { fontSize: 10 * scale }]}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.carouselSide}>
            <Text style={[styles.swipeHint, { fontSize: 10 * scale }]}>◀  Swipe to browse  ▶</Text>

            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onCarouselScroll}
              scrollEventThrottle={16}
              snapToInterval={itemW}
              decelerationRate="fast"
              contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
            >
              {MATCH_CATEGORIES.map((cat, index) => (
                <Animated.View
                  key={cat.id}
                  style={{ marginRight: circleGap, alignItems: 'center', transform: [{ scale: scaleAnims[index] }] }}
                >
                  <TouchableOpacity
                    onPress={() => goToCircle(index)}
                    activeOpacity={0.85}
                    style={[styles.catCircle, {
                      width: circleSize, height: circleSize, borderRadius: circleSize / 2,
                      backgroundColor: cat.bgColor,
                      borderColor: index === activeCircle ? cat.borderColor : 'rgba(255,255,255,0.25)',
                      borderWidth: index === activeCircle ? 5 : 2.5,
                      shadowColor: cat.shadowColor,
                    }]}
                  >
                    <Text style={{ fontSize: circleSize * 0.3 }}>{cat.icon}</Text>
                    <Text style={[styles.circleLabel, {
                      fontSize: circleSize * 0.1,
                      color: index === activeCircle ? cat.borderColor : '#fff',
                    }]}>{cat.label}</Text>
                    <Text style={[styles.circleTagline, { fontSize: circleSize * 0.072 }]}>{cat.tagline}</Text>
                  </TouchableOpacity>
                  {index === activeCircle && (
                    <View style={[styles.activeDot, { backgroundColor: cat.borderColor }]} />
                  )}
                </Animated.View>
              ))}
            </ScrollView>

            <View style={styles.dotsRow}>
              {MATCH_CATEGORIES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToCircle(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, {
                    backgroundColor: i === activeCircle ? MATCH_CATEGORIES[activeCircle].borderColor : 'rgba(255,255,255,0.3)',
                    width: i === activeCircle ? 22 : 8,
                  }]} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.playBtn, {
                backgroundColor: MATCH_CATEGORIES[activeCircle].bgColor,
                borderColor: MATCH_CATEGORIES[activeCircle].borderColor,
              }]}
              onPress={() => setSelectedCat(MATCH_CATEGORIES[activeCircle])}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 * scale }}>{MATCH_CATEGORIES[activeCircle].icon}</Text>
              <Text style={[styles.playBtnText, { fontSize: 15 * scale }]}>
                Choose {MATCH_CATEGORIES[activeCircle].label}!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── LEVEL PICKER ───────────────────────────────────────────────────────────
  if (!selectedLevel) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { backgroundColor: selectedCat.bgColor }]}>
          <TouchableOpacity style={styles.navBtn} onPress={backToCategories} activeOpacity={0.85}>
            <Text style={{ fontSize: 13 * scale, color: '#fff', fontWeight: '800' }}>◀ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>
              {selectedCat.icon} {selectedCat.label} — Pick a Level
            </Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose your difficulty!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.levelBody}>
          {/* Left: preview of pairs */}
          <View style={[styles.levelInfoPanel, { backgroundColor: selectedCat.bgColor }]}>
            <Text style={{ fontSize: 44 * scale }}>{selectedCat.icon}</Text>
            <Text style={[styles.infoTitle, { fontSize: 16 * scale }]}>{selectedCat.label}</Text>
            <View style={styles.pairsPreview}>
              {selectedCat.pairs.slice(0, 4).map((p, i) => (
                <View key={i} style={[styles.previewPill, { backgroundColor: selectedCat.pairColors[i] + '44', borderColor: selectedCat.pairColors[i] }]}>
                  <Text style={{ fontSize: 16 * scale }}>{p.left}</Text>
                  <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>→</Text>
                  <Text style={{ fontSize: 16 * scale }}>{p.right}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.infoDesc, { fontSize: 11 * scale }]}>
              7 pairs · 5 levels{'\n'}Tap left, then match right!
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Right: level cards */}
          <View style={styles.levelsPanel}>
            <Text style={[styles.swipeHint, { fontSize: 10 * scale, marginBottom: 6 }]}>
              Select a level to play
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsGrid}>
              {MATCH_LEVELS.map(lv => (
                <TouchableOpacity
                  key={lv.level}
                  style={[styles.levelCard, { borderColor: lv.color, backgroundColor: lv.color + '22' }]}
                  onPress={() => startGame(selectedCat, lv)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.levelBadge, { backgroundColor: lv.color }]}>
                    <Text style={[styles.levelBadgeText, { fontSize: 11 * scale }]}>{lv.level}</Text>
                  </View>
                  <Text style={[styles.levelLabel, { fontSize: 11 * scale, color: lv.color }]}>{lv.label}</Text>
                  <Text style={[styles.levelDifficulty, { fontSize: 9 * scale }]}>{lv.difficulty}</Text>
                  <Text style={[styles.levelDetail, { fontSize: 8.5 * scale }]}>
                    {lv.pairs} pairs{'\n'}to match
                  </Text>
                  <View style={[styles.levelPlayBtn, { backgroundColor: lv.color }]}>
                    <Text style={[styles.levelPlayText, { fontSize: 9 * scale }]}>▶ Play</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  // ── GAME VIEW ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: '#EDE7F6' }]}>

      {/* Header */}
      <View style={[styles.header, { height: HDR, backgroundColor: selectedCat.bgColor }]}>
        <TouchableOpacity style={styles.navBtn} onPress={backToLevels} activeOpacity={0.85}>
          <Text style={{ fontSize: 13 * scale, color: '#fff', fontWeight: '800' }}>◀ Levels</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={{ fontSize: 18 * scale }}>{selectedCat.icon}</Text>
          <Text style={[styles.headerTitle, { fontSize: 14 * scale }]}>
            {selectedCat.label} · Lvl {selectedLevel.level}
          </Text>
          <View style={[styles.lvlBadge, { backgroundColor: selectedLevel.color }]}>
            <Text style={[styles.lvlBadgeText, { fontSize: 9 * scale }]}>{selectedLevel.label}</Text>
          </View>
        </View>

        <View style={styles.starsWrap}>
          {Array.from({ length: totalPairs }).map((_, i) => (
            <Text key={i} style={{ fontSize: 12 * scale, opacity: i < matchCount ? 1 : 0.2 }}>⭐</Text>
          ))}
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.scoreChip, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
            <Text style={[styles.scoreLabel, { fontSize: 9 * scale }]}>Matched</Text>
            <Text style={[styles.scoreVal, { fontSize: 14 * scale }]}>{matchCount}/{totalPairs}</Text>
          </View>
          {errors > 0 && (
            <View style={styles.errorChip}>
              <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>❌ {errors}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.newGameBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
            onPress={() => startGame(selectedCat, selectedLevel)}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '900' }}>🔄 New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hint / feedback / win */}
      {feedback ? (
        <View style={[styles.hintRow, { height: HINT, backgroundColor: feedback.ok ? '#43A047' : '#E53935', borderColor: feedback.ok ? '#2E7D32' : '#B71C1C' }]}>
          <Text style={[styles.hintText, { fontSize: 12 * scale, color: '#fff' }]}>{feedback.text}</Text>
        </View>
      ) : won ? (
        <View style={[styles.winBanner, { backgroundColor: selectedCat.bgColor }]}>
          <Text style={[styles.winText, { fontSize: 12 * scale }]}>
            ⭐ Level {selectedLevel.level} Complete! {errors === 0 ? 'Perfect! 🎉' : `${errors} mistake${errors > 1 ? 's' : ''}`}
          </Text>
          {!isLastLevel && (
            <TouchableOpacity style={[styles.winBtn, { backgroundColor: '#FFD700' }]} onPress={nextLevel} activeOpacity={0.85}>
              <Text style={[styles.winBtnText, { fontSize: 11 * scale, color: '#2E7D32' }]}>Next Level ▶</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.winBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]} onPress={() => startGame(selectedCat, selectedLevel)} activeOpacity={0.85}>
            <Text style={[styles.winBtnText, { fontSize: 11 * scale }]}>🔄 Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.winBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]} onPress={backToLevels} activeOpacity={0.85}>
            <Text style={[styles.winBtnText, { fontSize: 11 * scale }]}>📋 Levels</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.hintRow, { height: HINT }]}>
          <Text style={[styles.hintText, { fontSize: 12 * scale }]}>
            {selectedLeft !== null
              ? '👉 Now tap its match on the right!'
              : selectedRight !== null
              ? '👈 Now tap its match on the left!'
              : '👆 Tap any item on either side to start matching!'}
          </Text>
        </View>
      )}

      {/* Game body: left column | connector | right column */}
      <View style={styles.gameBody}>

        {/* Left column */}
        <View style={styles.column}>
          {leftItems.map((item, i) => {
            const state = leftStates[i];
            const isSelected = selectedLeft === i;
            const isWrong = wrongPair?.l === i;
            const pairColor = state.matched
              ? selectedCat.pairColors[state.colorIndex]
              : selectedCat.bgColor;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleLeftPressWithRightSelected(i)}
                activeOpacity={0.8}
                style={[
                  styles.matchCard,
                  { height: rowH, borderRadius: rowH * 0.2 },
                  state.matched && { backgroundColor: pairColor, borderColor: '#fff', borderWidth: 3 },
                  !state.matched && isSelected && { backgroundColor: selectedCat.bgColor + 'EE', borderColor: selectedCat.borderColor, borderWidth: 3, transform: [{ scale: 1.05 }] },
                  !state.matched && isWrong && { backgroundColor: '#FFEBEE', borderColor: '#E53935', borderWidth: 3 },
                  !state.matched && !isSelected && !isWrong && { backgroundColor: '#fff', borderColor: selectedCat.borderColor + '66', borderWidth: 2 },
                ]}
              >
                <Text style={{ fontSize: emojiSize }}>{item.emoji}</Text>
                {state.matched && <Text style={[styles.matchCheck, { fontSize: rowH * 0.22 }]}>✅</Text>}
                {isSelected && !state.matched && (
                  <View style={[styles.selDot, { backgroundColor: selectedCat.borderColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Center connector column */}
        <View style={styles.connectorCol}>
          {leftStates.map((state, i) => (
            <View key={i} style={[styles.connectorRow, { height: rowH }]}>
              {state.matched ? (
                <>
                  <View style={[styles.connLine, { backgroundColor: selectedCat.pairColors[state.colorIndex] }]} />
                  <Text style={{ fontSize: rowH * 0.28 }}>🔗</Text>
                  <View style={[styles.connLine, { backgroundColor: selectedCat.pairColors[state.colorIndex] }]} />
                </>
              ) : (
                <View style={styles.connDash} />
              )}
            </View>
          ))}
        </View>

        {/* Right column */}
        <View style={styles.column}>
          {rightItems.map((item, i) => {
            const state = rightStates[i];
            const isSelected = selectedRight === i;
            const isWrong = wrongPair?.r === i;
            const pairColor = state.matched
              ? selectedCat.pairColors[state.colorIndex]
              : selectedCat.bgColor;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleRightPress(i)}
                activeOpacity={0.8}
                style={[
                  styles.matchCard,
                  { height: rowH, borderRadius: rowH * 0.2 },
                  state.matched && { backgroundColor: pairColor, borderColor: '#fff', borderWidth: 3 },
                  !state.matched && isSelected && { backgroundColor: selectedCat.bgColor + 'EE', borderColor: selectedCat.borderColor, borderWidth: 3, transform: [{ scale: 1.05 }] },
                  !state.matched && isWrong && { backgroundColor: '#FFEBEE', borderColor: '#E53935', borderWidth: 3 },
                  !state.matched && !isSelected && !isWrong && { backgroundColor: '#fff', borderColor: selectedCat.borderColor + '66', borderWidth: 2 },
                ]}
              >
                <Text style={{ fontSize: emojiSize }}>{item.emoji}</Text>
                {state.matched && <Text style={[styles.matchCheck, { fontSize: rowH * 0.22 }]}>✅</Text>}
                {isSelected && !state.matched && (
                  <View style={[styles.selDot, { backgroundColor: selectedCat.borderColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#16213E', padding: PAD, gap: 8 },
  header: {
    height: HDR, flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingHorizontal: 14, gap: 8,
  },
  navBtn: {
    minWidth: 52, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 8,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: '900', color: '#FFD700', letterSpacing: 0.3 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 1 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lvlBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  lvlBadgeText: { color: '#fff', fontWeight: '800' },
  starsWrap: { flex: 1, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center', minWidth: 62 },
  scoreLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase' },
  scoreVal: { color: '#fff', fontWeight: '900' },
  errorChip: { backgroundColor: '#B71C1C', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  newGameBtn: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  // Category picker
  pickerBody: { flex: 1, flexDirection: 'row', gap: 12 },
  infoPanel: {
    flex: 0.85, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    padding: 18, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  infoTitle: { fontWeight: '900', color: '#FFD700', textAlign: 'center' },
  infoDesc: { color: 'rgba(255,255,255,0.88)', fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  infoBadges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  infoBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  infoBadgeText: { color: '#fff', fontWeight: '700' },
  divider: { width: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginVertical: 10 },
  carouselSide: { flex: 1.15, alignItems: 'center', justifyContent: 'center', gap: 12 },
  swipeHint: { color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 2 },
  catCircle: {
    justifyContent: 'center', alignItems: 'center', gap: 3,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  circleLabel: { fontWeight: '900', textAlign: 'center' },
  circleTagline: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'center', paddingHorizontal: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 20, borderWidth: 3, paddingHorizontal: 24, paddingVertical: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  playBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },
  // Level picker
  levelBody: { flex: 1, flexDirection: 'row', gap: 12 },
  levelInfoPanel: {
    flex: 0.8, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  pairsPreview: { gap: 5, alignItems: 'center' },
  previewPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5,
  },
  levelsPanel: { flex: 1.2, justifyContent: 'center', gap: 6 },
  levelsGrid: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4 },
  levelCard: {
    width: 82, borderRadius: 14, borderWidth: 2,
    padding: 7, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  levelBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  levelBadgeText: { color: '#fff', fontWeight: '900' },
  levelLabel: { fontWeight: '900', textAlign: 'center' },
  levelDifficulty: { color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  levelDetail: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 13 },
  levelPlayBtn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  levelPlayText: { color: '#fff', fontWeight: '900' },
  // Hint / win
  hintRow: {
    backgroundColor: '#FFF9C4', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F9A825',
  },
  hintText: { fontWeight: '700', color: '#5D4037' },
  winBanner: {
    borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  winText: { fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  winBtn: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  winBtnText: { color: '#fff', fontWeight: '900' },
  // Game body
  gameBody: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 0 },
  column: { flex: 1, gap: 6, justifyContent: 'center' },
  matchCard: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 4,
  },
  matchCheck: { position: 'absolute', bottom: 2, right: 6 },
  selDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5 },
  connectorCol: { width: 60, justifyContent: 'center', gap: 6 },
  connectorRow: { justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  connLine: { flex: 1, height: 3, borderRadius: 2 },
  connDash: { flex: 1, height: 2, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 2 },
});
