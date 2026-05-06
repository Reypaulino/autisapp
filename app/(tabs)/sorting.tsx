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
type BinId = string;

type SortItem = {
  id: number;
  emoji: string;
  binId: BinId;
  sorted: boolean;
};

type Bin = {
  id: BinId;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
};

type SortCategory = {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  tagline: string;
  bins: Bin[];
  items: Omit<SortItem, 'id' | 'sorted'>[];
};

type SortLevel = {
  level: number;
  label: string;
  itemsPerBin: number;
  difficulty: string;
  color: string;
};

// ── Levels ────────────────────────────────────────────────────────────────────
const SORT_LEVELS: SortLevel[] = [
  { level: 1, label: 'Beginner', itemsPerBin: 2, difficulty: '⭐☆☆☆☆', color: '#4CAF50' },
  { level: 2, label: 'Easy',     itemsPerBin: 3, difficulty: '⭐⭐☆☆☆', color: '#8BC34A' },
  { level: 3, label: 'Medium',   itemsPerBin: 4, difficulty: '⭐⭐⭐☆☆', color: '#FF9800' },
  { level: 4, label: 'Hard',     itemsPerBin: 5, difficulty: '⭐⭐⭐⭐☆', color: '#FF5722' },
  { level: 5, label: 'Expert',   itemsPerBin: 6, difficulty: '⭐⭐⭐⭐⭐', color: '#E53935' },
];

// ── Categories & items ────────────────────────────────────────────────────────
const SORT_CATEGORIES: SortCategory[] = [
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌿',
    bgColor: '#2E7D32',
    borderColor: '#FFEB3B',
    shadowColor: '#1B5E20',
    tagline: 'Animals & Fruits',
    bins: [
      { id: 'animals', label: 'Animals', icon: '🐾', bgColor: '#FF8C42', borderColor: '#E65100' },
      { id: 'fruits',  label: 'Fruits',  icon: '🍎', bgColor: '#43A047', borderColor: '#2E7D32' },
    ],
    items: [
      { emoji: '🐶', binId: 'animals' },
      { emoji: '🐱', binId: 'animals' },
      { emoji: '🐻', binId: 'animals' },
      { emoji: '🦊', binId: 'animals' },
      { emoji: '🐼', binId: 'animals' },
      { emoji: '🦁', binId: 'animals' },
      { emoji: '🍎', binId: 'fruits' },
      { emoji: '🍊', binId: 'fruits' },
      { emoji: '🍌', binId: 'fruits' },
      { emoji: '🍇', binId: 'fruits' },
      { emoji: '🍓', binId: 'fruits' },
      { emoji: '🍉', binId: 'fruits' },
    ],
  },
  {
    id: 'transport',
    label: 'Vehicles',
    icon: '🚗',
    bgColor: '#1565C0',
    borderColor: '#FFD700',
    shadowColor: '#0D47A1',
    tagline: 'Land, Sea & Air',
    bins: [
      { id: 'land', label: 'Land', icon: '🛣️', bgColor: '#5C35C9', borderColor: '#3D1F9B' },
      { id: 'sea',  label: 'Sea',  icon: '🌊', bgColor: '#0288D1', borderColor: '#01579B' },
      { id: 'air',  label: 'Air',  icon: '☁️', bgColor: '#00897B', borderColor: '#00695C' },
    ],
    items: [
      { emoji: '🚗', binId: 'land' },
      { emoji: '🚌', binId: 'land' },
      { emoji: '🚲', binId: 'land' },
      { emoji: '🏎️', binId: 'land' },
      { emoji: '🚂', binId: 'land' },
      { emoji: '🚜', binId: 'land' },
      { emoji: '🚢', binId: 'sea' },
      { emoji: '⛵', binId: 'sea' },
      { emoji: '🚤', binId: 'sea' },
      { emoji: '🛥️', binId: 'sea' },
      { emoji: '⛴️', binId: 'sea' },
      { emoji: '🚣', binId: 'sea' },
      { emoji: '✈️', binId: 'air' },
      { emoji: '🚁', binId: 'air' },
      { emoji: '🚀', binId: 'air' },
      { emoji: '🛸', binId: 'air' },
      { emoji: '🪂', binId: 'air' },
      { emoji: '🛩️', binId: 'air' },
    ],
  },
  {
    id: 'clothes',
    label: 'Clothes',
    icon: '👕',
    bgColor: '#AD1457',
    borderColor: '#FFD700',
    shadowColor: '#880E4F',
    tagline: 'Tops, Bottoms & Accessories',
    bins: [
      { id: 'tops',        label: 'Tops',        icon: '👕', bgColor: '#C2185B', borderColor: '#880E4F' },
      { id: 'bottoms',     label: 'Bottoms',     icon: '👖', bgColor: '#7B1FA2', borderColor: '#4A148C' },
      { id: 'accessories', label: 'Accessories', icon: '🎩', bgColor: '#00838F', borderColor: '#006064' },
    ],
    items: [
      { emoji: '👕', binId: 'tops' },
      { emoji: '👔', binId: 'tops' },
      { emoji: '🧥', binId: 'tops' },
      { emoji: '👗', binId: 'tops' },
      { emoji: '👘', binId: 'tops' },
      { emoji: '🥼', binId: 'tops' },
      { emoji: '👖', binId: 'bottoms' },
      { emoji: '🩱', binId: 'bottoms' },
      { emoji: '🩲', binId: 'bottoms' },
      { emoji: '🩳', binId: 'bottoms' },
      { emoji: '🩴', binId: 'bottoms' },
      { emoji: '👙', binId: 'bottoms' },
      { emoji: '🧣', binId: 'accessories' },
      { emoji: '🎩', binId: 'accessories' },
      { emoji: '👟', binId: 'accessories' },
      { emoji: '👜', binId: 'accessories' },
      { emoji: '💍', binId: 'accessories' },
      { emoji: '👓', binId: 'accessories' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍕',
    bgColor: '#E53935',
    borderColor: '#FFD700',
    shadowColor: '#B71C1C',
    tagline: 'Fast Food, Sweets & Drinks',
    bins: [
      { id: 'fastfood', label: 'Fast Food', icon: '🍔', bgColor: '#E65100', borderColor: '#BF360C' },
      { id: 'sweets',   label: 'Sweets',    icon: '🍰', bgColor: '#E91E63', borderColor: '#AD1457' },
      { id: 'drinks',   label: 'Drinks',    icon: '🥤', bgColor: '#1E88E5', borderColor: '#1565C0' },
    ],
    items: [
      { emoji: '🍔', binId: 'fastfood' },
      { emoji: '🍕', binId: 'fastfood' },
      { emoji: '🌮', binId: 'fastfood' },
      { emoji: '🍟', binId: 'fastfood' },
      { emoji: '🌭', binId: 'fastfood' },
      { emoji: '🥪', binId: 'fastfood' },
      { emoji: '🍩', binId: 'sweets' },
      { emoji: '🎂', binId: 'sweets' },
      { emoji: '🍦', binId: 'sweets' },
      { emoji: '🍫', binId: 'sweets' },
      { emoji: '🍬', binId: 'sweets' },
      { emoji: '🧁', binId: 'sweets' },
      { emoji: '🥤', binId: 'drinks' },
      { emoji: '🧃', binId: 'drinks' },
      { emoji: '☕', binId: 'drinks' },
      { emoji: '🧋', binId: 'drinks' },
      { emoji: '🍵', binId: 'drinks' },
      { emoji: '🥛', binId: 'drinks' },
    ],
  },
  {
    id: 'space',
    label: 'Space',
    icon: '🚀',
    bgColor: '#4527A0',
    borderColor: '#CE93D8',
    shadowColor: '#311B92',
    tagline: 'Planets, Stars & Rockets',
    bins: [
      { id: 'planets', label: 'Planets', icon: '🪐', bgColor: '#283593', borderColor: '#1A237E' },
      { id: 'stars',   label: 'Stars',   icon: '⭐', bgColor: '#F57F17', borderColor: '#E65100' },
      { id: 'rockets', label: 'Rockets', icon: '🚀', bgColor: '#00695C', borderColor: '#004D40' },
    ],
    items: [
      { emoji: '🌍', binId: 'planets' },
      { emoji: '🪐', binId: 'planets' },
      { emoji: '🌙', binId: 'planets' },
      { emoji: '☀️', binId: 'planets' },
      { emoji: '🌎', binId: 'planets' },
      { emoji: '🌏', binId: 'planets' },
      { emoji: '⭐', binId: 'stars' },
      { emoji: '🌟', binId: 'stars' },
      { emoji: '💫', binId: 'stars' },
      { emoji: '✨', binId: 'stars' },
      { emoji: '🌠', binId: 'stars' },
      { emoji: '☄️', binId: 'stars' },
      { emoji: '🚀', binId: 'rockets' },
      { emoji: '🛸', binId: 'rockets' },
      { emoji: '🛰️', binId: 'rockets' },
      { emoji: '🚁', binId: 'rockets' },
      { emoji: '🛩️', binId: 'rockets' },
      { emoji: '🌌', binId: 'rockets' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: '⚽',
    bgColor: '#00695C',
    borderColor: '#FFD700',
    shadowColor: '#004D40',
    tagline: 'Team, Water & Racket Sports',
    bins: [
      { id: 'team',   label: 'Team',   icon: '⚽', bgColor: '#2E7D32', borderColor: '#1B5E20' },
      { id: 'water',  label: 'Water',  icon: '🏊', bgColor: '#0277BD', borderColor: '#01579B' },
      { id: 'racket', label: 'Racket', icon: '🎾', bgColor: '#E65100', borderColor: '#BF360C' },
    ],
    items: [
      { emoji: '⚽', binId: 'team' },
      { emoji: '🏀', binId: 'team' },
      { emoji: '🏈', binId: 'team' },
      { emoji: '⚾', binId: 'team' },
      { emoji: '🏐', binId: 'team' },
      { emoji: '🏉', binId: 'team' },
      { emoji: '🏊', binId: 'water' },
      { emoji: '🤽', binId: 'water' },
      { emoji: '🚣', binId: 'water' },
      { emoji: '🤿', binId: 'water' },
      { emoji: '🏄', binId: 'water' },
      { emoji: '🛶', binId: 'water' },
      { emoji: '🎾', binId: 'racket' },
      { emoji: '🏸', binId: 'racket' },
      { emoji: '🏓', binId: 'racket' },
      { emoji: '🥍', binId: 'racket' },
      { emoji: '🏒', binId: 'racket' },
      { emoji: '🎱', binId: 'racket' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createItems(cat: SortCategory, itemsPerBin: number): SortItem[] {
  const byBin: Record<string, Omit<SortItem, 'id' | 'sorted'>[]> = {};
  for (const item of cat.items) {
    if (!byBin[item.binId]) byBin[item.binId] = [];
    byBin[item.binId].push(item);
  }
  const selected = cat.bins.flatMap(bin =>
    (byBin[bin.id] || []).slice(0, itemsPerBin),
  );
  return shuffle(selected).map((item, id) => ({ ...item, id, sorted: false }));
}

function getScale(w: number) {
  if (w >= 1300) return 1.35;
  if (w >= 1000) return 1.15;
  if (w >= 800)  return 1.0;
  return 0.85;
}

type Feedback = { text: string; ok: boolean } | null;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SortingGame() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const correctPlayer = useAudioPlayer(SND_CORRECT);
  const wrongPlayer   = useAudioPlayer(SND_WRONG);
  const winPlayer     = useAudioPlayer(SND_WIN);
  const [selectedCat, setSelectedCat] = useState<SortCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SortLevel | null>(null);
  const [activeCircle, setActiveCircle] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(
    SORT_CATEGORIES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.8)),
  ).current;

  // Game state
  const [items, setItems] = useState<SortItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const { width, height } = dims;
  const scale = getScale(width);
  const isTablet = width >= 800;
  const circleSize = isTablet ? 150 : 110;
  const circleGap  = isTablet ? 28 : 18;
  const itemW = circleSize + circleGap;

  // ── Carousel helpers ───────────────────────────────────────────────────────
  const animateTo = (index: number) => {
    setActiveCircle(index);
    SORT_CATEGORIES.forEach((_, i) => {
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
    if (index !== activeCircle && index >= 0 && index < SORT_CATEGORIES.length) {
      animateTo(index);
    }
  };

  const goToCircle = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateTo(index);
  };

  // ── Game helpers ───────────────────────────────────────────────────────────
  const startGame = (cat: SortCategory, lv: SortLevel) => {
    setSelectedCat(cat);
    setSelectedLevel(lv);
    setItems(createItems(cat, lv.itemsPerBin));
    setSelectedId(null);
    setStars(0);
    setErrors(0);
    setFeedback(null);
  };

  const backToCategories = () => {
    setSelectedCat(null);
    setSelectedLevel(null);
    setItems([]);
    setFeedback(null);
  };

  const backToLevels = () => {
    setSelectedLevel(null);
    setItems([]);
    setFeedback(null);
  };

  const nextLevel = () => {
    if (!selectedCat || !selectedLevel) return;
    const next = SORT_LEVELS.find(l => l.level === selectedLevel.level + 1);
    if (next) startGame(selectedCat, next);
  };

  const showFeedback = (text: string, ok: boolean) => {
    setFeedback({ text, ok });
    setTimeout(() => setFeedback(null), 750);
  };

  const handleItemPress = (id: number) => {
    if (items.find(i => i.id === id)?.sorted) return;
    setSelectedId(prev => (prev === id ? null : id));
  };

  const handleBinPress = (binId: BinId) => {
    if (selectedId === null) return;
    const item = items.find(i => i.id === selectedId);
    if (!item) return;
    if (item.binId === binId) {
      playSound(correctPlayer);
      setItems(prev => prev.map(i => (i.id === selectedId ? { ...i, sorted: true } : i)));
      setStars(s => s + 1);
      showFeedback('Yay! Great job! 🌟', true);
    } else {
      playSound(wrongPlayer);
      setErrors(e => e + 1);
      showFeedback('Oops! Try again! 😊', false);
    }
    setSelectedId(null);
  };

  const won = items.length > 0 && items.every(i => i.sorted);
  const total = items.length;
  const isLastLevel = selectedLevel?.level === SORT_LEVELS.length;

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

  // ── Dynamic sizing ─────────────────────────────────────────────────────────
  const PAD = 12;
  const HDR = 52;
  const HINT = 36;
  const ITEM_GAP = 6;
  const COLS = 4;
  const itemsPanelW = (width - PAD * 2) * 0.42 - 20;
  const itemSize = Math.max(36, Math.floor((itemsPanelW - ITEM_GAP * (COLS - 1)) / COLS));

  const hint = won
    ? ''
    : selectedId !== null
    ? '👇 Drop it into the right box!'
    : '👆 Tap an item to pick it up!';

  // ── CATEGORY PICKER ────────────────────────────────────────────────────────
  if (!selectedCat) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { backgroundColor: '#E65100' }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={{ fontSize: 18 * scale }}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🗂️ Sort It Out!</Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose a category to play!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.pickerBody}>
          <View style={[styles.infoPanel, { backgroundColor: '#E65100' }]}>
            <Text style={{ fontSize: 52 * scale }}>🗂️</Text>
            <Text style={[styles.infoTitle, { fontSize: 18 * scale }]}>Sort It Out!</Text>
            <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>
              Pick up each item and{'\n'}drop it in the right box!{'\n'}5 levels of challenge! ⭐
            </Text>
            <View style={styles.infoBadges}>
              {['Sorting', 'Logic', 'Fun'].map(b => (
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
              {SORT_CATEGORIES.map((cat, index) => (
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
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: cat.bgColor,
                        borderColor: index === activeCircle ? cat.borderColor : 'rgba(255,255,255,0.25)',
                        borderWidth: index === activeCircle ? 5 : 2.5,
                        shadowColor: cat.shadowColor,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: circleSize * 0.3 }}>{cat.icon}</Text>
                    <Text style={[styles.circleLabel, {
                      fontSize: circleSize * 0.1,
                      color: index === activeCircle ? cat.borderColor : '#fff',
                    }]}>
                      {cat.label}
                    </Text>
                    <Text style={[styles.circleTagline, { fontSize: circleSize * 0.073 }]}>
                      {cat.tagline}
                    </Text>
                  </TouchableOpacity>
                  {index === activeCircle && (
                    <View style={[styles.activeDot, { backgroundColor: cat.borderColor }]} />
                  )}
                </Animated.View>
              ))}
            </ScrollView>

            <View style={styles.dotsRow}>
              {SORT_CATEGORIES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToCircle(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, {
                    backgroundColor: i === activeCircle ? SORT_CATEGORIES[activeCircle].borderColor : 'rgba(255,255,255,0.3)',
                    width: i === activeCircle ? 22 : 8,
                  }]} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.playBtn, {
                backgroundColor: SORT_CATEGORIES[activeCircle].bgColor,
                borderColor: SORT_CATEGORIES[activeCircle].borderColor,
              }]}
              onPress={() => setSelectedCat(SORT_CATEGORIES[activeCircle])}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 * scale }}>{SORT_CATEGORIES[activeCircle].icon}</Text>
              <Text style={[styles.playBtnText, { fontSize: 15 * scale }]}>
                Choose {SORT_CATEGORIES[activeCircle].label}!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── LEVEL PICKER ───────────────────────────────────────────────────────────
  if (!selectedLevel) {
    const binCount = selectedCat.bins.length;
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
            {/* Bins preview */}
            <View style={styles.binsPreviewWrap}>
              {selectedCat.bins.map(bin => (
                <View key={bin.id} style={[styles.binPreviewPill, { backgroundColor: bin.bgColor }]}>
                  <Text style={{ fontSize: 14 * scale }}>{bin.icon}</Text>
                  <Text style={[styles.binPreviewLabel, { fontSize: 10 * scale }]}>{bin.label}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.infoDesc, { fontSize: 11 * scale }]}>
              {binCount} bins · 5 levels{'\n'}Sort items into the right box!
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
              {SORT_LEVELS.map(lv => {
                const totalItems = lv.itemsPerBin * binCount;
                return (
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
                      {lv.itemsPerBin}/bin{'\n'}{totalItems} items
                    </Text>
                    <View style={[styles.levelPlayBtn, { backgroundColor: lv.color }]}>
                      <Text style={[styles.levelPlayText, { fontSize: 9 * scale }]}>▶ Play</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  // ── GAME VIEW ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: '#FFF8E1' }]}>

      {/* Header */}
      <View style={[styles.header, { height: HDR, backgroundColor: selectedCat.bgColor }]}>
        <TouchableOpacity style={styles.navBtn} onPress={backToLevels} activeOpacity={0.85}>
          <Text style={{ fontSize: 13 * scale, color: '#fff', fontWeight: '800' }}>◀ Levels</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={{ fontSize: 20 * scale }}>{selectedCat.icon}</Text>
          <Text style={[styles.headerTitle, { fontSize: 14 * scale }]}>
            {selectedCat.label} · Lvl {selectedLevel.level}
          </Text>
          <View style={[styles.lvlBadge, { backgroundColor: selectedLevel.color }]}>
            <Text style={[styles.lvlBadgeText, { fontSize: 9 * scale }]}>{selectedLevel.label}</Text>
          </View>
        </View>

        <View style={styles.starsWrap}>
          {Array.from({ length: total }).map((_, i) => (
            <Text key={i} style={{ fontSize: 10 * scale, opacity: i < stars ? 1 : 0.2 }}>⭐</Text>
          ))}
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.scoreChip, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
            <Text style={[styles.scoreLabel, { fontSize: 9 * scale }]}>Score</Text>
            <Text style={[styles.scoreVal, { fontSize: 14 * scale }]}>{stars}/{total}</Text>
          </View>
          {errors > 0 && (
            <View style={styles.errorChip}>
              <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>❌ {errors}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.newGameBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
            onPress={() => startGame(selectedCat, selectedLevel)}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 12 * scale, color: '#fff', fontWeight: '900' }}>🔄 New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback */}
      {feedback && (
        <View style={[styles.feedbackBanner, { backgroundColor: feedback.ok ? '#43A047' : '#E53935' }]}>
          <Text style={[styles.feedbackText, { fontSize: 14 * scale }]}>{feedback.text}</Text>
        </View>
      )}

      {/* Hint / Win */}
      {won ? (
        <View style={[styles.winBanner, { backgroundColor: selectedCat.bgColor }]}>
          <Text style={[styles.winText, { fontSize: 12 * scale }]}>
            ⭐ Level {selectedLevel.level} Complete! {stars} sorted, {errors} errors!
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
          <Text style={[styles.hintText, { fontSize: 12 * scale }]}>{hint}</Text>
        </View>
      )}

      {/* Body */}
      <View style={styles.gameBody}>

        {/* Items panel */}
        <View style={styles.itemsPanel}>
          <View style={[styles.itemsPanelInner, { borderColor: selectedCat.borderColor + '88' }]}>
            <Text style={[styles.panelTitle, { fontSize: 11 * scale, color: selectedCat.bgColor }]}>
              Pick an item
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.itemsWrap, { gap: ITEM_GAP }]}
            >
              {items.map(item =>
                item.sorted ? null : (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemPress(item.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.itemCard,
                      {
                        width: itemSize,
                        height: itemSize,
                        borderRadius: itemSize * 0.22,
                        borderColor: selectedCat.borderColor + '88',
                      },
                      selectedId === item.id && [
                        styles.itemCardSelected,
                        { borderColor: selectedCat.borderColor },
                      ],
                    ]}
                  >
                    <Text style={{ fontSize: itemSize * 0.48 }}>{item.emoji}</Text>
                    {selectedId === item.id && (
                      <View style={[styles.selectedBadge, { backgroundColor: selectedCat.borderColor }]}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>
          </View>
        </View>

        {/* Bins panel */}
        <View style={styles.binsPanel}>
          {selectedCat.bins.map(bin => {
            const inside = items.filter(i => i.sorted && i.binId === bin.id);
            const binTotal = selectedLevel.itemsPerBin;
            const complete = inside.length === binTotal;
            const active = selectedId !== null;
            const bubbleSize = isTablet ? 36 : 28;
            return (
              <TouchableOpacity
                key={bin.id}
                onPress={() => handleBinPress(bin.id)}
                activeOpacity={0.82}
                style={[
                  styles.bin,
                  {
                    backgroundColor: complete ? bin.bgColor : bin.bgColor + 'CC',
                    borderColor: bin.borderColor,
                  },
                  active && styles.binActive,
                ]}
              >
                <View style={styles.binTop}>
                  <Text style={{ fontSize: 15 * scale }}>{bin.icon}</Text>
                  <Text style={[styles.binLabel, { fontSize: 12 * scale }]} numberOfLines={1}>
                    {bin.label}
                  </Text>
                  <View style={styles.binCountBadge}>
                    <Text style={[styles.binCountText, { fontSize: 10 * scale }]}>
                      {inside.length}/{binTotal}
                    </Text>
                  </View>
                  {complete && <Text style={{ fontSize: 13 * scale }}>✅</Text>}
                </View>

                <View style={styles.binItems}>
                  {inside.map(i => (
                    <View
                      key={i.id}
                      style={[styles.binBubble, { width: bubbleSize, height: bubbleSize, borderRadius: bubbleSize * 0.28 }]}
                    >
                      <Text style={{ fontSize: bubbleSize * 0.55 }}>{i.emoji}</Text>
                    </View>
                  ))}
                </View>

                {active && !complete && (
                  <View style={styles.dropZone}>
                    <Text style={[styles.dropZoneText, { fontSize: 9 * scale }]}>Drop here!</Text>
                  </View>
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
  screen: {
    flex: 1,
    backgroundColor: '#16213E',
    padding: 12,
    gap: 8,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    gap: 8,
  },
  navBtn: {
    minWidth: 52,
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
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lvlBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  lvlBadgeText: { color: '#fff', fontWeight: '800' },
  starsWrap: { flex: 1, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center', minWidth: 52 },
  scoreLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase' },
  scoreVal: { color: '#fff', fontWeight: '900' },
  errorChip: { backgroundColor: '#B71C1C', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  newGameBtn: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  // Picker
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
  binsPreviewWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginVertical: 4 },
  binPreviewPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  binPreviewLabel: { color: '#fff', fontWeight: '800' },
  levelsPanel: { flex: 1.2, justifyContent: 'center', gap: 6 },
  levelsGrid: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4 },
  levelCard: {
    width: 82,
    borderRadius: 14, borderWidth: 2,
    padding: 7, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  levelBadge: {
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  levelBadgeText: { color: '#fff', fontWeight: '900' },
  levelLabel: { fontWeight: '900', textAlign: 'center' },
  levelDifficulty: { color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  levelDetail: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 13 },
  levelPlayBtn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  levelPlayText: { color: '#fff', fontWeight: '900' },
  // Game feedback / hints
  feedbackBanner: {
    borderRadius: 12, paddingVertical: 6, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  feedbackText: { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },
  hintRow: {
    backgroundColor: '#FFF9C4', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#F9A825',
  },
  hintText: { fontWeight: '700', color: '#5D4037' },
  winBanner: {
    borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  winText: { fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  winBtn: { backgroundColor: '#FFD700', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  winBtnText: { color: '#fff', fontWeight: '900' },
  // Game body
  gameBody: { flex: 1, flexDirection: 'row', gap: 10, minHeight: 0 },
  itemsPanel: { width: '42%', minHeight: 0 },
  itemsPanelInner: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 8, borderWidth: 2,
    shadowColor: '#F9A825', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4,
  },
  panelTitle: { fontWeight: '800', marginBottom: 6, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  itemCard: {
    backgroundColor: '#FFF3E0', borderWidth: 2.5, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#F9A825', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  itemCardSelected: { borderWidth: 3.5, backgroundColor: '#FFFDE7', transform: [{ scale: 1.1 }], shadowOpacity: 0.4, elevation: 8 },
  selectedBadge: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  selectedBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  binsPanel: { flex: 1, gap: 6, minHeight: 0 },
  bin: {
    flex: 1, borderRadius: 14, borderWidth: 2.5, padding: 8, minHeight: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  binActive: { borderWidth: 3.5, shadowOpacity: 0.28, elevation: 8 },
  binTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  binLabel: { fontWeight: '900', color: '#fff', flex: 1 },
  binCountBadge: { backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  binCountText: { color: '#fff', fontWeight: '800' },
  binItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  binBubble: { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  dropZone: { marginTop: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderStyle: 'dashed', borderRadius: 7, paddingVertical: 2, alignItems: 'center' },
  dropZoneText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
});
