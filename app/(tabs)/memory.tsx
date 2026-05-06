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

// ── Categories ────────────────────────────────────────────────────────────────
type Category = {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  emojis: string[];
  pairColors: string[];
};

const CATEGORIES: Category[] = [
  {
    id: 'animals', label: 'Animals', icon: '🐾',
    bgColor: '#FF8C42', borderColor: '#FFD700', shadowColor: '#E65100',
    emojis: ['🐶','🐱','🐻','🦊','🐼','🐨','🐸','🦁'],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#FF9FF3','#54A0FF','#A29BFE','#1DD1A1'],
  },
  {
    id: 'fruits', label: 'Fruits', icon: '🍎',
    bgColor: '#43A047', borderColor: '#FFEB3B', shadowColor: '#2E7D32',
    emojis: ['🍎','🍊','🍋','🍇','🍓','🍉','🍑','🥝'],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#A29BFE','#FF9FF3','#1DD1A1','#48DBFB','#54A0FF'],
  },
  {
    id: 'vehicles', label: 'Vehicles', icon: '🚗',
    bgColor: '#1E88E5', borderColor: '#FFD700', shadowColor: '#1565C0',
    emojis: ['🚗','🚂','✈️','🚢','🚁','🚀','🚲','🏎️'],
    pairColors: ['#FF6B6B','#54A0FF','#FECA57','#1DD1A1','#FF9FF3','#FF9F43','#A29BFE','#48DBFB'],
  },
  {
    id: 'food', label: 'Food', icon: '🍕',
    bgColor: '#E53935', borderColor: '#FFD700', shadowColor: '#B71C1C',
    emojis: ['🍕','🍔','🌮','🍜','🍦','🎂','🍩','🥪'],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#1DD1A1','#54A0FF','#FF9FF3','#A29BFE'],
  },
  {
    id: 'space', label: 'Space', icon: '🚀',
    bgColor: '#5C35C9', borderColor: '#CE93D8', shadowColor: '#3D1F9B',
    emojis: ['🚀','🌙','⭐','🪐','☀️','🌍','🛸','🌠'],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#FF9FF3','#54A0FF','#A29BFE','#1DD1A1'],
  },
  {
    id: 'sports', label: 'Sports', icon: '⚽',
    bgColor: '#00897B', borderColor: '#FFD700', shadowColor: '#00695C',
    emojis: ['⚽','🏀','🎾','⚾','🏈','🏐','🎱','🏓'],
    pairColors: ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#FF9FF3','#54A0FF','#A29BFE','#1DD1A1'],
  },
];

// ── Levels ────────────────────────────────────────────────────────────────────
type Level = {
  level: number;
  label: string;
  pairs: number;
  cols: number;
  rows: number;
  difficulty: string;
  color: string;
};

const LEVELS: Level[] = [
  { level: 1, label: 'Beginner', pairs: 3, cols: 3, rows: 2, difficulty: '⭐☆☆☆☆', color: '#4CAF50' },
  { level: 2, label: 'Easy',     pairs: 4, cols: 4, rows: 2, difficulty: '⭐⭐☆☆☆', color: '#8BC34A' },
  { level: 3, label: 'Medium',   pairs: 5, cols: 5, rows: 2, difficulty: '⭐⭐⭐☆☆', color: '#FF9800' },
  { level: 4, label: 'Hard',     pairs: 6, cols: 4, rows: 3, difficulty: '⭐⭐⭐⭐☆', color: '#FF5722' },
  { level: 5, label: 'Expert',   pairs: 8, cols: 4, rows: 4, difficulty: '⭐⭐⭐⭐⭐', color: '#E53935' },
];

// ── Card type ─────────────────────────────────────────────────────────────────
type Card = {
  id: number;
  emoji: string;
  pairIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createCards(cat: Category, pairs: number): Card[] {
  const chosen = cat.emojis.slice(0, pairs);
  const deck = chosen.flatMap((emoji, pairIndex) => [
    { emoji, pairIndex },
    { emoji, pairIndex },
  ]);
  return shuffle(deck).map((item, id) => ({ ...item, id, isFlipped: false, isMatched: false }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAD = 12;
const GAP = 7;
const HDR = 52;
const INS = 30;

function getScale(w: number) {
  if (w >= 1300) return 1.35;
  if (w >= 1000) return 1.15;
  if (w >= 800)  return 1.0;
  return 0.85;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MemoryGame() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const correctPlayer = useAudioPlayer(SND_CORRECT);
  const wrongPlayer   = useAudioPlayer(SND_WRONG);
  const winPlayer     = useAudioPlayer(SND_WIN);

  // Navigation state: null → category picker, cat+null → level picker, cat+level → game
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  // Category carousel
  const [activeCircle, setActiveCircle] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(CATEGORIES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.8))).current;

  // Game state
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  // Match logic — compare by pairIndex (emoji-encoding safe)
  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    setMoves(m => m + 1);
    setLocked(true);
    if (cards[a].pairIndex === cards[b].pairIndex) {
      playSound(correctPlayer);
      setCards(prev => prev.map(c => (c.id === a || c.id === b ? { ...c, isMatched: true } : c)));
      setSelected([]);
      setLocked(false);
    } else {
      playSound(wrongPlayer);
      setTimeout(() => {
        setCards(prev => prev.map(c => (c.id === a || c.id === b ? { ...c, isFlipped: false } : c)));
        setSelected([]);
        setLocked(false);
      }, 900);
    }
  }, [selected]);

  const matchCount = cards.filter(c => c.isMatched).length / 2;
  const totalPairs = selectedLevel?.pairs ?? 0;

  useEffect(() => {
    if (selectedLevel && matchCount === totalPairs) setWon(true);
  }, [matchCount]);

  useEffect(() => {
    if (!won || !selectedLevel) return;
    playSound(winPlayer);
    if (selectedLevel.level === LEVELS.length) {
      const t = setTimeout(() => backToCategories(), 2000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => nextLevel(), 1500);
    return () => clearTimeout(t);
  }, [won]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const startGame = (cat: Category, lv: Level) => {
    setSelectedCat(cat);
    setSelectedLevel(lv);
    setCards(createCards(cat, lv.pairs));
    setSelected([]);
    setMoves(0);
    setLocked(false);
    setWon(false);
  };

  const backToLevels = () => {
    setSelectedLevel(null);
    setCards([]);
    setWon(false);
  };

  const backToCategories = () => {
    setSelectedCat(null);
    setSelectedLevel(null);
    setCards([]);
    setWon(false);
  };

  const nextLevel = () => {
    if (!selectedCat || !selectedLevel) return;
    const next = LEVELS.find(l => l.level === selectedLevel.level + 1);
    if (next) startGame(selectedCat, next);
  };

  const handleCardPress = (id: number) => {
    if (locked) return;
    const card = cards[id];
    if (card.isFlipped || card.isMatched || selected.length === 2) return;
    setCards(prev => prev.map(c => (c.id === id ? { ...c, isFlipped: true } : c)));
    setSelected(prev => [...prev, id]);
  };

  // ── Carousel helpers ──────────────────────────────────────────────────────
  const { width, height } = dims;
  const scale = getScale(width);
  const isTablet = width >= 800;
  const circleSize = isTablet ? 150 : 110;
  const circleGap  = isTablet ? 28 : 18;
  const itemW = circleSize + circleGap;

  const animateCircle = (index: number) => {
    setActiveCircle(index);
    CATEGORIES.forEach((_, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: i === index ? 1 : 0.8,
        useNativeDriver: true,
        friction: 6,
      }).start();
    });
  };

  const onCarouselScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / itemW);
    if (index !== activeCircle && index >= 0 && index < CATEGORIES.length) {
      animateCircle(index);
    }
  };

  const goToCircle = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateCircle(index);
  };

  // ── CATEGORY PICKER ───────────────────────────────────────────────────────
  if (!selectedCat) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { backgroundColor: '#1565C0' }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={{ fontSize: 18 * scale }}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🧩 Memory Match</Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose a category to play!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.pickerBody}>
          {/* Info panel */}
          <View style={styles.infoPanel}>
            <Text style={{ fontSize: 52 * scale }}>🧩</Text>
            <Text style={[styles.infoTitle, { fontSize: 18 * scale }]}>Memory Match</Text>
            <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>
              Flip cards two at a time.{'\n'}Find all matching pairs!{'\n'}5 levels of challenge! ⭐
            </Text>
            <View style={styles.infoBadges}>
              {['Memory', 'Focus', 'Fun'].map(b => (
                <View key={b} style={styles.infoBadge}>
                  <Text style={[styles.infoBadgeText, { fontSize: 10 * scale }]}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Carousel */}
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
              {CATEGORIES.map((cat, index) => (
                <Animated.View
                  key={cat.id}
                  style={{ marginRight: circleGap, alignItems: 'center', transform: [{ scale: scaleAnims[index] }] }}
                >
                  <TouchableOpacity
                    onPress={() => goToCircle(index)}
                    activeOpacity={0.85}
                    style={[
                      styles.catCircle,
                      {
                        width: circleSize, height: circleSize, borderRadius: circleSize / 2,
                        backgroundColor: cat.bgColor,
                        borderColor: index === activeCircle ? cat.borderColor : 'rgba(255,255,255,0.25)',
                        borderWidth: index === activeCircle ? 5 : 2.5,
                        shadowColor: cat.shadowColor,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: circleSize * 0.3 }}>{cat.icon}</Text>
                    <Text style={[styles.catCircleLabel, { fontSize: circleSize * 0.1, color: index === activeCircle ? cat.borderColor : '#fff' }]}>
                      {cat.label}
                    </Text>
                    <View style={styles.catPreviewRow}>
                      {cat.emojis.slice(0, 3).map((e, i) => (
                        <Text key={i} style={{ fontSize: circleSize * 0.1 }}>{e}</Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                  {index === activeCircle && (
                    <View style={[styles.activeDot, { backgroundColor: CATEGORIES[activeCircle].borderColor }]} />
                  )}
                </Animated.View>
              ))}
            </ScrollView>

            <View style={styles.dotsRow}>
              {CATEGORIES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToCircle(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, {
                    backgroundColor: i === activeCircle ? CATEGORIES[activeCircle].borderColor : 'rgba(255,255,255,0.3)',
                    width: i === activeCircle ? 22 : 8,
                  }]} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: CATEGORIES[activeCircle].bgColor, borderColor: CATEGORIES[activeCircle].borderColor }]}
              onPress={() => setSelectedCat(CATEGORIES[activeCircle])}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 * scale }}>{CATEGORIES[activeCircle].icon}</Text>
              <Text style={[styles.playBtnText, { fontSize: 15 * scale }]}>
                Choose {CATEGORIES[activeCircle].label}!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── LEVEL PICKER ──────────────────────────────────────────────────────────
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
          {/* Left: category preview */}
          <View style={[styles.levelInfoPanel, { backgroundColor: selectedCat.bgColor }]}>
            <Text style={{ fontSize: 54 * scale }}>{selectedCat.icon}</Text>
            <Text style={[styles.infoTitle, { fontSize: 18 * scale }]}>{selectedCat.label}</Text>
            <View style={styles.emojiPreviewGrid}>
              {selectedCat.emojis.map((e, i) => (
                <View key={i} style={[styles.emojiPreviewBubble, { backgroundColor: selectedCat.pairColors[i] + '44' }]}>
                  <Text style={{ fontSize: 20 * scale }}>{e}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.infoDesc, { fontSize: 11 * scale }]}>
              8 emojis · 5 levels{'\n'}Start easy, go expert!
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Right: level cards */}
          <View style={styles.levelsPanel}>
            <Text style={[styles.swipeHint, { fontSize: 10 * scale, marginBottom: 6 }]}>
              Select a level to play
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelsGrid}
            >
              {LEVELS.map(lv => (
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
                    {lv.pairs} pairs{'\n'}{lv.cols}×{lv.rows} grid
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

  // ── GAME VIEW ─────────────────────────────────────────────────────────────
  const { cols, rows } = selectedLevel;
  const usedH = PAD * 2 + HDR + 8 + INS + 8 + GAP * (rows - 1);
  const usedW = PAD * 2 + GAP * (cols - 1);
  const cardByH = (height - usedH) / rows;
  const cardByW = (width - usedW) / cols;
  const maxCard = isTablet ? 140 : 100;
  const cardSize = Math.min(cardByH, cardByW, maxCard);

  const instructionText = won
    ? ''
    : selected.length === 1
    ? '🔍 Now find its match!'
    : '👆 Tap two cards to find a match!';

  const isLastLevel = selectedLevel.level === LEVELS.length;

  return (
    <View style={[styles.screen, { backgroundColor: '#E8F4FD' }]}>

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
          {/* Level difficulty badge */}
          <View style={[styles.lvlBadge, { backgroundColor: selectedLevel.color }]}>
            <Text style={[styles.lvlBadgeText, { fontSize: 9 * scale }]}>{selectedLevel.label}</Text>
          </View>
        </View>

        <View style={styles.starsWrap}>
          {Array.from({ length: totalPairs }).map((_, i) => (
            <Text key={i} style={{ fontSize: 11 * scale, opacity: i < matchCount ? 1 : 0.2 }}>⭐</Text>
          ))}
        </View>

        <View style={styles.headerRight}>
          <View style={styles.movesChip}>
            <Text style={[styles.movesLabel, { fontSize: 9 * scale }]}>Moves</Text>
            <Text style={[styles.movesVal, { fontSize: 14 * scale }]}>{moves}</Text>
          </View>
          <TouchableOpacity style={styles.newGameBtn} onPress={() => startGame(selectedCat, selectedLevel)} activeOpacity={0.85}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 * scale }}>🔄 New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instruction / Win */}
      {won ? (
        <View style={[styles.winBanner, { height: INS + 8, backgroundColor: '#43A047', borderColor: '#2E7D32' }]}>
          <Text style={[styles.winText, { fontSize: 12 * scale }]}>
            ⭐ Level {selectedLevel.level} Complete! {moves} moves!
          </Text>
          {!isLastLevel && (
            <TouchableOpacity style={[styles.winBtn, { backgroundColor: '#FFD700' }]} onPress={nextLevel} activeOpacity={0.85}>
              <Text style={[styles.winBtnText, { fontSize: 11 * scale, color: '#2E7D32' }]}>
                Next Level ▶
              </Text>
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
        <View style={[styles.instructionRow, { height: INS }]}>
          <Text style={[styles.instructionText, { fontSize: 12 * scale }]}>{instructionText}</Text>
        </View>
      )}

      {/* Card Grid */}
      <View style={styles.grid}>
        {cards.map(card => {
          const revealed = card.isFlipped || card.isMatched;
          const pairColor = selectedCat.pairColors[card.pairIndex];
          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.8}
              style={[
                styles.card,
                { width: cardSize, height: cardSize, margin: GAP / 2, borderRadius: cardSize * 0.14 },
                card.isMatched
                  ? { backgroundColor: pairColor, borderColor: '#fff', borderWidth: 3, shadowColor: pairColor, shadowOpacity: 0.5, elevation: 8 }
                  : revealed
                  ? { backgroundColor: '#fff', borderColor: pairColor, borderWidth: 3 }
                  : { backgroundColor: selectedCat.bgColor + 'CC', borderColor: selectedCat.borderColor, borderWidth: 2 },
              ]}
            >
              {revealed ? (
                <>
                  <Text style={{ fontSize: cardSize * 0.42, lineHeight: cardSize * 0.52 }}>{card.emoji}</Text>
                  {card.isMatched && (
                    <Text style={[styles.matchStar, { fontSize: cardSize * 0.22 }]}>⭐</Text>
                  )}
                </>
              ) : (
                <View style={styles.cardBackInner}>
                  <Text style={{ fontSize: cardSize * 0.36 }}>❓</Text>
                  <View style={styles.cardDots}>
                    {[0, 1, 2].map(i => (
                      <View key={i} style={[styles.cardDot, { width: cardSize * 0.08, height: cardSize * 0.08, borderRadius: cardSize * 0.04 }]} />
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#16213E',
    padding: PAD,
  },
  header: {
    height: HDR,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 10,
  },
  navBtn: {
    minWidth: 42,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: '900', color: '#FFD700', letterSpacing: 0.3 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 1 },
  // Category picker
  pickerBody: { flex: 1, flexDirection: 'row', gap: 12 },
  infoPanel: {
    flex: 0.9, backgroundColor: '#1565C0', borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10,
    shadowColor: '#0D47A1', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  infoTitle: { fontWeight: '900', color: '#FFD700', textAlign: 'center' },
  infoDesc: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  infoBadges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  infoBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  infoBadgeText: { color: '#fff', fontWeight: '700' },
  divider: { width: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginVertical: 10 },
  carouselSide: { flex: 1.1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  swipeHint: { color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 2 },
  catCircle: {
    justifyContent: 'center', alignItems: 'center', gap: 3,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  catCircleLabel: { fontWeight: '900', textAlign: 'center' },
  catPreviewRow: { flexDirection: 'row', gap: 2 },
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
    flex: 0.8, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  emojiPreviewGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    justifyContent: 'center', marginVertical: 4,
  },
  emojiPreviewBubble: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  levelsPanel: { flex: 1.2, justifyContent: 'center', gap: 6 },
  levelsGrid: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4 },
  levelCard: {
    width: 82,
    borderRadius: 14, borderWidth: 2,
    padding: 7, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  levelBadge: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  levelBadgeText: { color: '#fff', fontWeight: '900' },
  levelLabel: { fontWeight: '900', textAlign: 'center' },
  levelDifficulty: { color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  levelDetail: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 13 },
  levelPlayBtn: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    marginTop: 2,
  },
  levelPlayText: { color: '#fff', fontWeight: '900' },
  // Game header
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lvlBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  lvlBadgeText: { color: '#fff', fontWeight: '800' },
  starsWrap: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 2, flexWrap: 'wrap' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  movesChip: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', minWidth: 52,
  },
  movesLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase' },
  movesVal: { color: '#fff', fontWeight: '900' },
  newGameBtn: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  // Instruction / Win
  instructionRow: {
    backgroundColor: '#FFF9C4', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    borderWidth: 2, borderColor: '#F9A825',
  },
  instructionText: { fontWeight: '700', color: '#5D4037' },
  winBanner: {
    borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 10,
    borderWidth: 2,
  },
  winText: { flex: 1, fontWeight: '800', color: '#fff', textAlign: 'center' },
  winBtn: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  winBtnText: { color: '#fff', fontWeight: '900' },
  // Cards
  grid: {
    flex: 1, flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', alignContent: 'center',
  },
  card: {
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  matchStar: { position: 'absolute', bottom: 2, right: 4 },
  cardBackInner: { alignItems: 'center', gap: 4 },
  cardDots: { flexDirection: 'row', gap: 4 },
  cardDot: { backgroundColor: 'rgba(255,255,255,0.4)' },
});
