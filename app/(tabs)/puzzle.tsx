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
type PuzzleCategory = {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  tagline: string;
  grid: string[]; // 9 emojis for 3×3
};

type PuzzleLevel = {
  level: number;
  label: string;
  missingCount: number;
  difficulty: string;
  color: string;
};

type Slot = {
  id: number;
  emoji: string;
  placed: string | null;
};

type Piece = {
  id: number;
  emoji: string;
  slotId: number;
  used: boolean;
};

// Which slot indices (0–8) to hide per level
const LEVEL_SLOTS: Record<number, number[]> = {
  1: [4, 1],
  2: [0, 4, 8],
  3: [1, 3, 5, 7],
  4: [0, 2, 4, 6, 8],
  5: [0, 1, 2, 5, 6, 7],
};

// ── Categories ────────────────────────────────────────────────────────────────
const PUZZLE_CATEGORIES: PuzzleCategory[] = [
  {
    id: 'nature', label: 'Nature', icon: '🌿',
    bgColor: '#2E7D32', borderColor: '#FFEB3B', shadowColor: '#1B5E20',
    tagline: 'Forest & flowers',
    grid: ['☀️', '☁️', '☀️', '🌳', '🦋', '🌳', '🌸', '🌺', '🌸'],
  },
  {
    id: 'ocean', label: 'Ocean', icon: '🌊',
    bgColor: '#0277BD', borderColor: '#FFD700', shadowColor: '#01579B',
    tagline: 'Underwater world',
    grid: ['🌤️', '🐦', '🌤️', '🌊', '🐬', '🌊', '🐠', '🐚', '🐠'],
  },
  {
    id: 'space', label: 'Space', icon: '🚀',
    bgColor: '#4527A0', borderColor: '#CE93D8', shadowColor: '#311B92',
    tagline: 'Galaxy & rockets',
    grid: ['⭐', '🌙', '⭐', '🪐', '🚀', '🪐', '💫', '🌟', '💫'],
  },
  {
    id: 'farm', label: 'Farm', icon: '🚜',
    bgColor: '#E65100', borderColor: '#FFD700', shadowColor: '#BF360C',
    tagline: 'Animals & harvest',
    grid: ['☀️', '🌤️', '☀️', '🌻', '🐄', '🌻', '🌾', '🐓', '🌾'],
  },
  {
    id: 'city', label: 'City', icon: '🏙️',
    bgColor: '#37474F', borderColor: '#FFD700', shadowColor: '#263238',
    tagline: 'Urban adventure',
    grid: ['🏙️', '🌇', '🏙️', '🚗', '🚦', '🚗', '🏪', '🏬', '🏪'],
  },
  {
    id: 'forest', label: 'Forest', icon: '🌲',
    bgColor: '#1B5E20', borderColor: '#FFD700', shadowColor: '#003300',
    tagline: 'Wild animals in the woods',
    grid: ['🦅', '🌤️', '🦅', '🌲', '🦌', '🌲', '🍄', '🌿', '🍄'],
  },
];

// ── Levels ────────────────────────────────────────────────────────────────────
const PUZZLE_LEVELS: PuzzleLevel[] = [
  { level: 1, label: 'Beginner', missingCount: 2, difficulty: '⭐☆☆☆☆', color: '#4CAF50' },
  { level: 2, label: 'Easy',     missingCount: 3, difficulty: '⭐⭐☆☆☆', color: '#8BC34A' },
  { level: 3, label: 'Medium',   missingCount: 4, difficulty: '⭐⭐⭐☆☆', color: '#FF9800' },
  { level: 4, label: 'Hard',     missingCount: 5, difficulty: '⭐⭐⭐⭐☆', color: '#FF5722' },
  { level: 5, label: 'Expert',   missingCount: 6, difficulty: '⭐⭐⭐⭐⭐', color: '#E53935' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createPuzzle(cat: PuzzleCategory, lv: PuzzleLevel) {
  const missingIds = LEVEL_SLOTS[lv.level];
  const slots: Slot[] = cat.grid.map((emoji, id) => ({
    id,
    emoji,
    placed: missingIds.includes(id) ? null : emoji,
  }));
  const pieces: Piece[] = shuffle(
    missingIds.map((slotId, i) => ({
      id: i,
      emoji: cat.grid[slotId],
      slotId,
      used: false,
    })),
  );
  return { slots, pieces };
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
export default function PuzzleGame() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const correctPlayer = useAudioPlayer(SND_CORRECT);
  const wrongPlayer   = useAudioPlayer(SND_WRONG);
  const winPlayer     = useAudioPlayer(SND_WIN);
  const [selectedCat, setSelectedCat] = useState<PuzzleCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<PuzzleLevel | null>(null);
  const [activeCircle, setActiveCircle] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(
    PUZZLE_CATEGORIES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.8)),
  ).current;

  // Game state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [wrongSlotId, setWrongSlotId] = useState<number | null>(null);
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
    PUZZLE_CATEGORIES.forEach((_, i) => {
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
    if (index !== activeCircle && index >= 0 && index < PUZZLE_CATEGORIES.length) {
      animateTo(index);
    }
  };

  const goToCircle = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateTo(index);
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const startGame = (cat: PuzzleCategory, lv: PuzzleLevel) => {
    const puzzle = createPuzzle(cat, lv);
    setSelectedCat(cat);
    setSelectedLevel(lv);
    setSlots(puzzle.slots);
    setPieces(puzzle.pieces);
    setSelectedPiece(null);
    setErrors(0);
    setWrongSlotId(null);
    setFeedback(null);
  };

  const backToCategories = () => { setSelectedCat(null); setSelectedLevel(null); };
  const backToLevels = () => { setSelectedLevel(null); };

  const nextLevel = () => {
    if (!selectedCat || !selectedLevel) return;
    const next = PUZZLE_LEVELS.find(l => l.level === selectedLevel.level + 1);
    if (next) startGame(selectedCat, next);
  };

  // ── Game logic ─────────────────────────────────────────────────────────────
  const missingIds = selectedLevel ? LEVEL_SLOTS[selectedLevel.level] : [];
  const won = slots.length > 0 && slots.every(s => s.placed !== null);
  const isLastLevel = selectedLevel?.level === PUZZLE_LEVELS.length;
  const placed = slots.filter(s => missingIds.includes(s.id) && s.placed !== null).length;
  const total = selectedLevel?.missingCount ?? 0;

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

  const handlePiecePress = (id: number) => {
    setSelectedPiece(prev => (prev === id ? null : id));
  };

  const handleSlotPress = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.placed !== null || selectedPiece === null) return;
    const piece = pieces.find(p => p.id === selectedPiece);
    if (!piece) return;

    if (piece.slotId === slotId) {
      playSound(correctPlayer);
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, placed: piece.emoji } : s));
      setPieces(prev => prev.map(p => p.id === selectedPiece ? { ...p, used: true } : p));
      setSelectedPiece(null);
      showFeedback('Great job! 🌟', true);
    } else {
      playSound(wrongPlayer);
      setErrors(e => e + 1);
      setWrongSlotId(slotId);
      setTimeout(() => setWrongSlotId(null), 500);
      showFeedback('Not here — try another spot! 😊', false);
    }
  };

  // ── Sizing ─────────────────────────────────────────────────────────────────
  const gameBodyH = height - PAD * 2 - HDR - HINT - 8 * 3;
  const gridPanelW = (width - PAD * 2 - 10) * 0.55;
  const tileSize = Math.min(
    Math.floor(gridPanelW / 3) - 6,
    Math.floor(gameBodyH / 3) - 6,
    isTablet ? 120 : 90,
  );
  const piecePanelW = (width - PAD * 2 - 10) * 0.41;
  const pieceSize = Math.min(Math.floor(piecePanelW / 3) - 8, tileSize);

  // ── CATEGORY PICKER ────────────────────────────────────────────────────────
  if (!selectedCat) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { backgroundColor: '#37474F' }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={{ fontSize: 18 * scale }}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🧩 Picture Puzzle</Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose a scene to complete!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.pickerBody}>
          <View style={[styles.infoPanel, { backgroundColor: '#37474F' }]}>
            <Text style={{ fontSize: 52 * scale }}>🧩</Text>
            <Text style={[styles.infoTitle, { fontSize: 18 * scale }]}>Picture Puzzle</Text>
            <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>
              Place each missing tile{'\n'}back in the right spot!{'\n'}5 levels of challenge! ⭐
            </Text>
            <View style={styles.infoBadges}>
              {['Puzzle', 'Visual', 'Spatial'].map(b => (
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
              {PUZZLE_CATEGORIES.map((cat, index) => (
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
              {PUZZLE_CATEGORIES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToCircle(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, {
                    backgroundColor: i === activeCircle ? PUZZLE_CATEGORIES[activeCircle].borderColor : 'rgba(255,255,255,0.3)',
                    width: i === activeCircle ? 22 : 8,
                  }]} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.playBtn, {
                backgroundColor: PUZZLE_CATEGORIES[activeCircle].bgColor,
                borderColor: PUZZLE_CATEGORIES[activeCircle].borderColor,
              }]}
              onPress={() => setSelectedCat(PUZZLE_CATEGORIES[activeCircle])}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 * scale }}>{PUZZLE_CATEGORIES[activeCircle].icon}</Text>
              <Text style={[styles.playBtnText, { fontSize: 15 * scale }]}>
                Choose {PUZZLE_CATEGORIES[activeCircle].label}!
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
          {/* Left: category preview with mini grid */}
          <View style={[styles.levelInfoPanel, { backgroundColor: selectedCat.bgColor }]}>
            <Text style={{ fontSize: 44 * scale }}>{selectedCat.icon}</Text>
            <Text style={[styles.infoTitle, { fontSize: 16 * scale }]}>{selectedCat.label}</Text>
            <View style={styles.miniGrid}>
              {selectedCat.grid.map((emoji, i) => (
                <View key={i} style={[styles.miniTile, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)' }]}>
                  <Text style={{ fontSize: 16 * scale }}>{emoji}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.infoDesc, { fontSize: 11 * scale }]}>
              3×3 scene · 5 levels{'\n'}Place pieces in the right spot!
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Right: level cards */}
          <View style={styles.levelsPanel}>
            <Text style={[styles.swipeHint, { fontSize: 10 * scale, marginBottom: 6 }]}>
              Select a level to play
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsGrid}>
              {PUZZLE_LEVELS.map(lv => (
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
                    {lv.missingCount} pieces{'\n'}to place
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
          <View style={[styles.lvlBadge, { backgroundColor: selectedLevel.color }]}>
            <Text style={[styles.lvlBadgeText, { fontSize: 9 * scale }]}>{selectedLevel.label}</Text>
          </View>
        </View>

        <View style={styles.starsWrap}>
          {Array.from({ length: total }).map((_, i) => (
            <Text key={i} style={{ fontSize: 12 * scale, opacity: i < placed ? 1 : 0.2 }}>⭐</Text>
          ))}
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.scoreChip, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
            <Text style={[styles.scoreLabel, { fontSize: 9 * scale }]}>Placed</Text>
            <Text style={[styles.scoreVal, { fontSize: 14 * scale }]}>{placed}/{total}</Text>
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

      {/* Feedback / Hint / Win */}
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
            {selectedPiece !== null
              ? '👇 Tap the empty tile where this piece belongs!'
              : '👆 Tap a piece from the panel to select it!'}
          </Text>
        </View>
      )}

      {/* Game body */}
      <View style={styles.gameBody}>

        {/* Puzzle grid */}
        <View style={styles.gridPanel}>
          <View style={styles.puzzleGrid}>
            {slots.map(slot => {
              const isMissing = missingIds.includes(slot.id);
              const isWrong = wrongSlotId === slot.id;
              const isComplete = isMissing && slot.placed !== null;
              const canTap = isMissing && slot.placed === null && selectedPiece !== null;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => (isMissing && slot.placed === null ? handleSlotPress(slot.id) : undefined)}
                  activeOpacity={canTap ? 0.75 : 1}
                  style={[
                    styles.tile,
                    { width: tileSize, height: tileSize, borderRadius: tileSize * 0.15 },
                    !isMissing && {
                      backgroundColor: selectedCat.bgColor + 'DD',
                      borderColor: selectedCat.borderColor + '66',
                      borderWidth: 2,
                    },
                    isMissing && !isWrong && slot.placed === null && {
                      backgroundColor: 'rgba(255,255,255,0.65)',
                      borderColor: canTap ? selectedCat.borderColor : 'rgba(0,0,0,0.18)',
                      borderWidth: canTap ? 3 : 2,
                      borderStyle: canTap ? 'solid' : 'dashed',
                    },
                    isMissing && isWrong && {
                      backgroundColor: '#FFEBEE',
                      borderColor: '#E53935',
                      borderWidth: 3,
                    },
                    isComplete && {
                      backgroundColor: selectedCat.bgColor + 'BB',
                      borderColor: '#4CAF50',
                      borderWidth: 3,
                    },
                  ]}
                >
                  {isMissing && slot.placed === null ? (
                    <Text style={{ fontSize: tileSize * 0.34, opacity: isWrong ? 0.6 : 0.35 }}>
                      {isWrong ? '❌' : '❓'}
                    </Text>
                  ) : (
                    <>
                      <Text style={{ fontSize: tileSize * 0.44 }}>{slot.placed ?? slot.emoji}</Text>
                      {isComplete && (
                        <Text style={[styles.checkMark, { fontSize: tileSize * 0.22 }]}>✅</Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Piece bank */}
        <View style={styles.piecePanel}>
          <View style={[styles.piecePanelInner, { borderColor: selectedCat.borderColor + '88' }]}>
            <Text style={[styles.panelTitle, { fontSize: 10 * scale, color: selectedCat.bgColor }]}>
              {pieces.filter(p => !p.used).length === 0 ? 'All placed! 🎉' : `${pieces.filter(p => !p.used).length} piece${pieces.filter(p => !p.used).length !== 1 ? 's' : ''} left`}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.piecesWrap}>
              {pieces.map(piece =>
                piece.used ? null : (
                  <TouchableOpacity
                    key={piece.id}
                    onPress={() => handlePiecePress(piece.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.piece,
                      {
                        width: pieceSize,
                        height: pieceSize,
                        borderRadius: pieceSize * 0.18,
                        borderColor: selectedCat.borderColor + '88',
                      },
                      selectedPiece === piece.id && [
                        styles.pieceSelected,
                        { borderColor: selectedCat.borderColor },
                      ],
                    ]}
                  >
                    <Text style={{ fontSize: pieceSize * 0.5 }}>{piece.emoji}</Text>
                    {selectedPiece === piece.id && (
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
  scoreChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center', minWidth: 52 },
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
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 114, gap: 3 },
  miniTile: {
    width: 34, height: 34, borderRadius: 6, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
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
  // Hint / Win
  hintRow: {
    backgroundColor: '#FFF9C4', borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', borderWidth: 2, borderColor: '#F9A825',
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
  gameBody: { flex: 1, flexDirection: 'row', gap: 10, minHeight: 0 },
  gridPanel: { flex: 0.58, justifyContent: 'center', alignItems: 'center' },
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tile: {
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  checkMark: { position: 'absolute', bottom: 2, right: 2 },
  piecePanel: { flex: 0.38, minHeight: 0 },
  piecePanelInner: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 8, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4,
  },
  panelTitle: {
    fontWeight: '800', marginBottom: 6, textAlign: 'center',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  piecesWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  piece: {
    backgroundColor: '#F3F4F6', borderWidth: 2.5, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  pieceSelected: {
    borderWidth: 3.5, backgroundColor: '#FFFDE7',
    transform: [{ scale: 1.08 }], shadowOpacity: 0.3, elevation: 6,
  },
  selectedBadge: {
    position: 'absolute', top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  selectedBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
});
