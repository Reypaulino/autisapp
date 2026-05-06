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
type JigsawCategory = {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  tagline: string;
  grid: string[]; // 4×4 = 16 emojis, row-major
};

type JigsawLevel = {
  level: number;
  label: string;
  cols: number;
  rows: number;
  difficulty: string;
  color: string;
};

type JSlot = { id: number; emoji: string; placed: boolean };
type JPiece = { id: number; emoji: string; slotId: number; used: boolean };

// ── Levels ────────────────────────────────────────────────────────────────────
const JIGSAW_LEVELS: JigsawLevel[] = [
  { level: 1, label: 'Beginner', cols: 2, rows: 2, difficulty: '⭐☆☆☆☆', color: '#4CAF50' },
  { level: 2, label: 'Easy',     cols: 3, rows: 2, difficulty: '⭐⭐☆☆☆', color: '#8BC34A' },
  { level: 3, label: 'Medium',   cols: 3, rows: 3, difficulty: '⭐⭐⭐☆☆', color: '#FF9800' },
  { level: 4, label: 'Hard',     cols: 4, rows: 3, difficulty: '⭐⭐⭐⭐☆', color: '#FF5722' },
  { level: 5, label: 'Expert',   cols: 4, rows: 4, difficulty: '⭐⭐⭐⭐⭐', color: '#E53935' },
];

// ── Categories — each has a 4×4 (16 emoji) scene ─────────────────────────────
const JIGSAW_CATEGORIES: JigsawCategory[] = [
  {
    id: 'sunrise', label: 'Sunrise', icon: '🌅',
    bgColor: '#E65100', borderColor: '#FFD700', shadowColor: '#BF360C',
    tagline: 'Mountains at dawn',
    grid: ['☀️','🌤️','☁️','☁️','🏔️','🏔️','🏔️','🌄','🌲','🌲','🌿','🌻','🌸','🌺','🌼','🌾'],
  },
  {
    id: 'beach', label: 'Beach', icon: '🏖️',
    bgColor: '#0277BD', borderColor: '#FFD700', shadowColor: '#01579B',
    tagline: 'Sun, sand & sea',
    grid: ['☀️','☀️','🌤️','🌤️','🌊','🌊','🌊','🌊','🏖️','🦀','🐚','🦞','🌴','🌴','🌴','🌴'],
  },
  {
    id: 'city', label: 'City Night', icon: '🌆',
    bgColor: '#37474F', borderColor: '#FFD700', shadowColor: '#263238',
    tagline: 'Lights of the city',
    grid: ['🌙','⭐','⭐','🌙','🏙️','🏢','🏬','🏢','🚗','🚕','🚌','🚗','🛣️','🚦','🏪','🛣️'],
  },
  {
    id: 'forest', label: 'Forest', icon: '🌲',
    bgColor: '#2E7D32', borderColor: '#FFEB3B', shadowColor: '#1B5E20',
    tagline: 'Wildlife in the woods',
    grid: ['☀️','🌤️','☀️','🌤️','🌲','🌲','🌲','🌲','🦊','🐇','🦌','🐿️','🍄','🌿','🍄','🌿'],
  },
  {
    id: 'space', label: 'Space', icon: '🚀',
    bgColor: '#4527A0', borderColor: '#CE93D8', shadowColor: '#311B92',
    tagline: 'Explore the galaxy',
    grid: ['⭐','🌙','⭐','⭐','🪐','⭐','☄️','⭐','⭐','🚀','⭐','🛸','🌍','⭐','💫','⭐'],
  },
  {
    id: 'carnival', label: 'Carnival', icon: '🎪',
    bgColor: '#AD1457', borderColor: '#FFD700', shadowColor: '#880E4F',
    tagline: 'Fun at the fair!',
    grid: ['🎈','🎈','🎡','🎡','🎪','🎪','🎠','🎠','🍭','🍦','🎯','🎭','🎶','🎵','🎈','🎉'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getSubGrid(grid: string[], cols: number, rows: number): string[] {
  const out: string[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push(grid[r * 4 + c]);
  return out;
}

function createJigsaw(cat: JigsawCategory, lv: JigsawLevel) {
  const sub = getSubGrid(cat.grid, lv.cols, lv.rows);
  const slots: JSlot[] = sub.map((emoji, id) => ({ id, emoji, placed: false }));
  const pieces: JPiece[] = shuffle(sub.map((emoji, id) => ({ id, emoji, slotId: id, used: false })));
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
const HINT = 44;
const TILE_GAP = 6;
const PIECE_GAP = 6;

// ── Component ─────────────────────────────────────────────────────────────────
export default function JigsawGame() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const correctPlayer = useAudioPlayer(SND_CORRECT);
  const wrongPlayer   = useAudioPlayer(SND_WRONG);
  const winPlayer     = useAudioPlayer(SND_WIN);
  const [selectedCat, setSelectedCat] = useState<JigsawCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<JigsawLevel | null>(null);
  const [activeCircle, setActiveCircle] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnims = useRef(JIGSAW_CATEGORIES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.8))).current;

  // Game state
  const [slots, setSlots] = useState<JSlot[]>([]);
  const [pieces, setPieces] = useState<JPiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<JPiece | null>(null);
  const [errors, setErrors] = useState(0);
  const [wrongSlotId, setWrongSlotId] = useState<number | null>(null);
  const [successSlotId, setSuccessSlotId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Pulse animation for selected piece
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (selectedPiece) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseRef.current?.stop();
  }, [selectedPiece]);

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

  // ── Sizing ─────────────────────────────────────────────────────────────────
  const cols = selectedLevel?.cols ?? 4;
  const rows = selectedLevel?.rows ?? 4;
  const boardPanelW = (width - PAD * 2 - 10) * 0.56;
  const boardPanelH = height - PAD * 2 - HDR - HINT - 8 * 3 - 16;
  const tileByW = Math.floor((boardPanelW - TILE_GAP * (cols - 1)) / cols);
  const tileByH = Math.floor((boardPanelH - TILE_GAP * (rows - 1)) / rows);
  const maxTile = isTablet ? 130 : 95;
  const tileSize = Math.min(tileByW, tileByH, maxTile);
  const trayW = (width - PAD * 2 - 10) * 0.40 - 16;
  const pieceSize = Math.min(Math.floor((trayW - PIECE_GAP) / 2), tileSize, isTablet ? 90 : 72);

  // ── Carousel helpers ───────────────────────────────────────────────────────
  const animateTo = (index: number) => {
    setActiveCircle(index);
    JIGSAW_CATEGORIES.forEach((_, i) =>
      Animated.spring(scaleAnims[i], { toValue: i === index ? 1 : 0.8, useNativeDriver: true, friction: 6, tension: 80 }).start(),
    );
  };
  const onCarouselScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / itemW);
    if (index !== activeCircle && index >= 0 && index < JIGSAW_CATEGORIES.length) animateTo(index);
  };
  const goToCircle = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * itemW, animated: true });
    animateTo(index);
  };

  // ── Game helpers ───────────────────────────────────────────────────────────
  const startGame = (cat: JigsawCategory, lv: JigsawLevel) => {
    const puzzle = createJigsaw(cat, lv);
    setSelectedCat(cat);
    setSelectedLevel(lv);
    setSlots(puzzle.slots);
    setPieces(puzzle.pieces);
    setSelectedPiece(null);
    setErrors(0);
    setWrongSlotId(null);
    setSuccessSlotId(null);
    setFeedback(null);
  };

  const backToCategories = () => { setSelectedCat(null); setSelectedLevel(null); };
  const backToLevels = () => setSelectedLevel(null);

  const nextLevel = () => {
    if (!selectedCat || !selectedLevel) return;
    const next = JIGSAW_LEVELS.find(l => l.level === selectedLevel.level + 1);
    if (next) startGame(selectedCat, next);
  };

  const placed = slots.filter(s => s.placed).length;
  const total = slots.length;
  const won = total > 0 && placed === total;
  const isLastLevel = selectedLevel?.level === JIGSAW_LEVELS.length;

  useEffect(() => {
    if (!won || !selectedLevel || !selectedCat) return;
    playSound(winPlayer);
    if (isLastLevel) {
      const t = setTimeout(() => backToCategories(), 2000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => nextLevel(), 1800);
    return () => clearTimeout(t);
  }, [won]);

  const showFeedback = (text: string, ok: boolean) => {
    setFeedback({ text, ok });
    setTimeout(() => setFeedback(null), 700);
  };

  // ── Tap piece in tray ──────────────────────────────────────────────────────
  const handlePiecePress = (piece: JPiece) => {
    if (piece.used) return;
    setSelectedPiece(prev => prev?.id === piece.id ? null : piece);
    setWrongSlotId(null);
  };

  // ── Tap slot on board ──────────────────────────────────────────────────────
  const handleSlotPress = (slot: JSlot) => {
    // If slot is already placed, do nothing
    if (slot.placed) return;

    // If no piece selected → show hint
    if (!selectedPiece) {
      showFeedback('👆 Pick a piece from the right first!', false);
      return;
    }

    if (selectedPiece.slotId === slot.id) {
      // Correct!
      playSound(correctPlayer);
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, placed: true } : s));
      setPieces(prev => prev.map(p => p.id === selectedPiece.id ? { ...p, used: true } : p));
      setSuccessSlotId(slot.id);
      setTimeout(() => setSuccessSlotId(null), 600);
      setSelectedPiece(null);
      showFeedback('Perfect fit! 🌟', true);
    } else {
      // Wrong slot
      playSound(wrongPlayer);
      setErrors(e => e + 1);
      setWrongSlotId(slot.id);
      setTimeout(() => setWrongSlotId(null), 600);
      showFeedback("Doesn't fit here — try another! 😊", false);
    }
  };

  // ── CATEGORY PICKER ────────────────────────────────────────────────────────
  if (!selectedCat) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { backgroundColor: '#1A237E' }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={{ fontSize: 18 * scale }}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🧩 Jigsaw Puzzle</Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose a scene to build!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.pickerBody}>
          <View style={[styles.infoPanel, { backgroundColor: '#1A237E' }]}>
            <Text style={{ fontSize: 52 * scale }}>🧩</Text>
            <Text style={[styles.infoTitle, { fontSize: 18 * scale }]}>Jigsaw Puzzle</Text>
            <Text style={[styles.infoDesc, { fontSize: 12 * scale }]}>
              Tap a piece to pick it up,{'\n'}then tap the empty slot{'\n'}where it belongs! 5 levels! ⭐
            </Text>
            <View style={styles.infoBadges}>
              {['Jigsaw', 'Spatial', 'Visual'].map(b => (
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
              ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
              onScroll={onCarouselScroll} scrollEventThrottle={16}
              snapToInterval={itemW} decelerationRate="fast"
              contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
            >
              {JIGSAW_CATEGORIES.map((cat, index) => (
                <Animated.View key={cat.id} style={{ marginRight: circleGap, alignItems: 'center', transform: [{ scale: scaleAnims[index] }] }}>
                  <TouchableOpacity
                    onPress={() => goToCircle(index)} activeOpacity={0.85}
                    style={[styles.catCircle, {
                      width: circleSize, height: circleSize, borderRadius: circleSize / 2,
                      backgroundColor: cat.bgColor,
                      borderColor: index === activeCircle ? cat.borderColor : 'rgba(255,255,255,0.25)',
                      borderWidth: index === activeCircle ? 5 : 2.5,
                      shadowColor: cat.shadowColor,
                    }]}
                  >
                    <Text style={{ fontSize: circleSize * 0.3 }}>{cat.icon}</Text>
                    <Text style={[styles.circleLabel, { fontSize: circleSize * 0.1, color: index === activeCircle ? cat.borderColor : '#fff' }]}>{cat.label}</Text>
                    <Text style={[styles.circleTagline, { fontSize: circleSize * 0.073 }]}>{cat.tagline}</Text>
                  </TouchableOpacity>
                  {index === activeCircle && <View style={[styles.activeDot, { backgroundColor: cat.borderColor }]} />}
                </Animated.View>
              ))}
            </ScrollView>
            <View style={styles.dotsRow}>
              {JIGSAW_CATEGORIES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToCircle(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, {
                    backgroundColor: i === activeCircle ? JIGSAW_CATEGORIES[activeCircle].borderColor : 'rgba(255,255,255,0.3)',
                    width: i === activeCircle ? 22 : 8,
                  }]} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: JIGSAW_CATEGORIES[activeCircle].bgColor, borderColor: JIGSAW_CATEGORIES[activeCircle].borderColor }]}
              onPress={() => setSelectedCat(JIGSAW_CATEGORIES[activeCircle])} activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 * scale }}>{JIGSAW_CATEGORIES[activeCircle].icon}</Text>
              <Text style={[styles.playBtnText, { fontSize: 15 * scale }]}>Choose {JIGSAW_CATEGORIES[activeCircle].label}!</Text>
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
            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>{selectedCat.icon} {selectedCat.label} — Pick a Level</Text>
            <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Choose your grid size!</Text>
          </View>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.levelBody}>
          <View style={[styles.levelInfoPanel, { backgroundColor: selectedCat.bgColor }]}>
            <Text style={{ fontSize: 44 * scale }}>{selectedCat.icon}</Text>
            <Text style={[styles.infoTitle, { fontSize: 16 * scale }]}>{selectedCat.label}</Text>
            <View style={styles.miniGrid}>
              {selectedCat.grid.map((e, i) => (
                <View key={i} style={[styles.miniTile, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                  <Text style={{ fontSize: 13 * scale }}>{e}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.infoDesc, { fontSize: 11 * scale }]}>
              Tap a piece, then tap{'\n'}its empty slot to place it!
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.levelsPanel}>
            <Text style={[styles.swipeHint, { fontSize: 10 * scale, marginBottom: 6 }]}>Select a level to play</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsGrid}>
              {JIGSAW_LEVELS.map(lv => (
                <TouchableOpacity
                  key={lv.level}
                  style={[styles.levelCard, { borderColor: lv.color, backgroundColor: lv.color + '22' }]}
                  onPress={() => startGame(selectedCat, lv)} activeOpacity={0.85}
                >
                  <View style={[styles.levelBadge, { backgroundColor: lv.color }]}>
                    <Text style={[styles.levelBadgeText, { fontSize: 11 * scale }]}>{lv.level}</Text>
                  </View>
                  <Text style={[styles.levelLabel, { fontSize: 11 * scale, color: lv.color }]}>{lv.label}</Text>
                  <Text style={[styles.levelDifficulty, { fontSize: 9 * scale }]}>{lv.difficulty}</Text>
                  <View style={styles.levelGridPreview}>
                    {getSubGrid(selectedCat.grid, lv.cols, lv.rows).map((e, i) => (
                      <View key={i} style={[styles.levelGridCell, { backgroundColor: lv.color + '44', width: 11, height: 11 }]}>
                        <Text style={{ fontSize: 6.5 }}>{e}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.levelDetail, { fontSize: 8.5 * scale }]}>{lv.cols}×{lv.rows} · {lv.cols * lv.rows} pcs</Text>
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
  const remainingPieces = pieces.filter(p => !p.used);

  return (
    <View style={[styles.screen, { backgroundColor: '#E8EAF6' }]}>

      {/* Header */}
      <View style={[styles.header, { height: HDR, backgroundColor: selectedCat.bgColor }]}>
        <TouchableOpacity style={styles.navBtn} onPress={backToLevels} activeOpacity={0.85}>
          <Text style={{ fontSize: 13 * scale, color: '#fff', fontWeight: '800' }}>◀ Levels</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={{ fontSize: 18 * scale }}>{selectedCat.icon}</Text>
          <Text style={[styles.headerTitle, { fontSize: 14 * scale }]}>{selectedCat.label} · Lvl {selectedLevel.level}</Text>
          <View style={[styles.lvlBadge, { backgroundColor: selectedLevel.color }]}>
            <Text style={[styles.lvlBadgeText, { fontSize: 9 * scale }]}>{selectedLevel.label}</Text>
          </View>
        </View>
        <View style={styles.starsWrap}>
          {Array.from({ length: total }).map((_, i) => (
            <Text key={i} style={{ fontSize: 11 * scale, opacity: i < placed ? 1 : 0.2 }}>⭐</Text>
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
          <TouchableOpacity style={[styles.newGameBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]} onPress={() => startGame(selectedCat, selectedLevel)} activeOpacity={0.85}>
            <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '900' }}>🔄 New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hint bar — shows feedback OR selected piece preview OR static hint */}
      {won ? (
        <View style={[styles.winBanner, { height: HINT, backgroundColor: selectedCat.bgColor }]}>
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
      ) : feedback ? (
        <View style={[styles.hintRow, { height: HINT, backgroundColor: feedback.ok ? '#43A047' : '#E53935', borderColor: feedback.ok ? '#2E7D32' : '#B71C1C' }]}>
          <Text style={[styles.hintText, { color: '#fff', fontSize: 13 * scale }]}>{feedback.text}</Text>
        </View>
      ) : selectedPiece ? (
        // Show selected piece floating in hint bar
        <View style={[styles.hintRow, { height: HINT, backgroundColor: selectedCat.bgColor + 'DD', borderColor: selectedCat.borderColor }]}>
          <Animated.View style={[styles.hintPieceWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={{ fontSize: HINT * 0.52 }}>{selectedPiece.emoji}</Text>
          </Animated.View>
          <Text style={[styles.hintText, { color: '#fff', fontSize: 12 * scale, flex: 1 }]}>
            Now tap the matching empty slot on the board!
          </Text>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: 'rgba(255,255,255,0.5)' }]}
            onPress={() => setSelectedPiece(null)} activeOpacity={0.8}
          >
            <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.hintRow, { height: HINT }]}>
          <Text style={[styles.hintText, { fontSize: 12 * scale }]}>
            {remainingPieces.length === 0 ? '🎉 All pieces placed!' : '👉 Tap a piece on the right, then tap its slot on the board!'}
          </Text>
        </View>
      )}

      {/* Game body */}
      <View style={styles.gameBody}>

        {/* Puzzle board */}
        <View style={styles.boardPanel}>
          <View style={[styles.board, { width: cols * tileSize + (cols - 1) * TILE_GAP, height: rows * tileSize + (rows - 1) * TILE_GAP }]}>
            {slots.map(slot => {
              const c = slot.id % cols;
              const r = Math.floor(slot.id / cols);
              const isWrong = wrongSlotId === slot.id;
              const isSuccess = successSlotId === slot.id;
              const isTarget = selectedPiece !== null && !slot.placed && selectedPiece.slotId === slot.id;
              const canTap = !slot.placed && selectedPiece !== null;

              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => handleSlotPress(slot)}
                  activeOpacity={canTap ? 0.65 : 1}
                  style={[
                    styles.tile,
                    {
                      width: tileSize, height: tileSize,
                      borderRadius: tileSize * 0.13,
                      position: 'absolute',
                      left: c * (tileSize + TILE_GAP),
                      top: r * (tileSize + TILE_GAP),
                    },
                    // Placed
                    slot.placed && !isSuccess && {
                      backgroundColor: selectedCat.bgColor + 'CC',
                      borderColor: '#4CAF50', borderWidth: 2.5,
                    },
                    // Just placed (flash green)
                    isSuccess && {
                      backgroundColor: '#C8E6C9',
                      borderColor: '#2E7D32', borderWidth: 3,
                    },
                    // Wrong tap flash
                    isWrong && {
                      backgroundColor: '#FFEBEE',
                      borderColor: '#E53935', borderWidth: 3,
                    },
                    // This is the exact correct slot for selected piece
                    isTarget && !isWrong && {
                      backgroundColor: selectedCat.borderColor + '33',
                      borderColor: selectedCat.borderColor,
                      borderWidth: 3,
                      borderStyle: 'dashed',
                    },
                    // Empty, piece selected but not the correct slot
                    !slot.placed && !isWrong && !isTarget && selectedPiece && {
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      borderColor: 'rgba(0,0,0,0.2)', borderWidth: 2, borderStyle: 'dashed',
                    },
                    // Empty, no piece selected
                    !slot.placed && !selectedPiece && {
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      borderColor: 'rgba(0,0,0,0.15)', borderWidth: 2, borderStyle: 'dashed',
                    },
                  ]}
                >
                  {/* Ghost hint (faint) when empty */}
                  {!slot.placed && (
                    <Text style={{ fontSize: tileSize * 0.44, opacity: isWrong ? 0.2 : isTarget ? 0.45 : 0.2 }}>
                      {slot.emoji}
                    </Text>
                  )}
                  {/* Placed emoji */}
                  {slot.placed && (
                    <Text style={{ fontSize: tileSize * 0.5 }}>{slot.emoji}</Text>
                  )}
                  {/* Wrong flash icon */}
                  {isWrong && <Text style={{ fontSize: tileSize * 0.28, position: 'absolute' }}>❌</Text>}
                  {/* Correct slot indicator */}
                  {isTarget && (
                    <View style={[styles.targetDot, { backgroundColor: selectedCat.borderColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Piece tray */}
        <View style={styles.trayPanel}>
          <View style={[styles.trayInner, { borderColor: selectedCat.borderColor + '88' }]}>
            <Text style={[styles.panelTitle, { fontSize: 10 * scale, color: selectedCat.bgColor }]}>
              {remainingPieces.length === 0 ? 'All placed! 🎉' : `${remainingPieces.length} piece${remainingPieces.length !== 1 ? 's' : ''} left`}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.piecesWrap}>
              {pieces.map(piece => {
                if (piece.used) return null;
                const isSelected = selectedPiece?.id === piece.id;
                return (
                  <TouchableOpacity
                    key={piece.id}
                    onPress={() => handlePiecePress(piece)}
                    activeOpacity={0.75}
                    style={[
                      styles.piece,
                      {
                        width: pieceSize, height: pieceSize,
                        borderRadius: pieceSize * 0.18,
                        borderColor: isSelected ? selectedCat.borderColor : selectedCat.borderColor + '55',
                        borderWidth: isSelected ? 3.5 : 2,
                        backgroundColor: isSelected ? selectedCat.bgColor + '22' : '#F0F4FF',
                        transform: [{ scale: isSelected ? 1.1 : 1 }],
                      },
                    ]}
                  >
                    <Text style={{ fontSize: pieceSize * 0.52 }}>{piece.emoji}</Text>
                    {isSelected && (
                      <View style={[styles.selBadge, { backgroundColor: selectedCat.borderColor }]}>
                        <Text style={{ fontSize: 9, color: '#fff', fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
  scoreChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center', minWidth: 56 },
  scoreLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase' },
  scoreVal: { color: '#fff', fontWeight: '900' },
  errorChip: { backgroundColor: '#B71C1C', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  newGameBtn: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  // Hint row
  hintRow: {
    backgroundColor: '#FFF9C4', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, borderWidth: 2, borderColor: '#F9A825', gap: 8,
  },
  hintPieceWrap: {
    width: 36, height: 36, backgroundColor: '#fff', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  hintText: { fontWeight: '700', color: '#5D4037', textAlign: 'center' },
  cancelBtn: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  // Win banner
  winBanner: {
    borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingHorizontal: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  winText: { fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  winBtn: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  winBtnText: { color: '#fff', fontWeight: '900' },
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
    padding: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 76, gap: 2 },
  miniTile: { width: 16, height: 16, borderRadius: 3, justifyContent: 'center', alignItems: 'center' },
  levelsPanel: { flex: 1.2, justifyContent: 'center', gap: 6 },
  levelsGrid: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4 },
  levelCard: {
    width: 88, borderRadius: 14, borderWidth: 2,
    padding: 7, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  levelBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  levelBadgeText: { color: '#fff', fontWeight: '900' },
  levelLabel: { fontWeight: '900', textAlign: 'center' },
  levelDifficulty: { color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  levelGridPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 1, justifyContent: 'center' },
  levelGridCell: { borderRadius: 1, justifyContent: 'center', alignItems: 'center' },
  levelDetail: { color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  levelPlayBtn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  levelPlayText: { color: '#fff', fontWeight: '900' },
  // Game body
  gameBody: { flex: 1, flexDirection: 'row', gap: 10, minHeight: 0 },
  boardPanel: { flex: 0.58, justifyContent: 'center', alignItems: 'center' },
  board: { position: 'relative' },
  tile: {
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
    overflow: 'hidden',
  },
  targetDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 10, height: 10, borderRadius: 5,
  },
  trayPanel: { flex: 0.40, minHeight: 0 },
  trayInner: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18,
    padding: 8, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4,
  },
  panelTitle: {
    fontWeight: '800', marginBottom: 6, textAlign: 'center',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  piecesWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: PIECE_GAP },
  piece: {
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 3,
  },
  selBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
});
