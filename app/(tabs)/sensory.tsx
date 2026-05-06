import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';

// Local sound assets
const SND_WIN     = require('@/assets/sounds/win.wav');
const SND_CORRECT = require('@/assets/sounds/correct.wav');
const SND_WRONG   = require('@/assets/sounds/wrong.wav');

function getScale(w: number) {
  if (w >= 1300) return 1.35;
  if (w >= 1000) return 1.15;
  if (w >= 800)  return 1.0;
  return 0.85;
}

// ── Catalogue ─────────────────────────────────────────────────────────────────
type GameId = 'colour' | 'rhythm' | 'bubble' | 'texture';

const GAMES = [
  { id: 'colour'  as GameId, title: 'Colour Mix',  emoji: '🎨', sense: 'Visual',         tagline: 'Tap 2 colours to mix the target!',  bgColor: '#6A1B9A', border: '#CE93D8' },
  { id: 'rhythm'  as GameId, title: 'Rhythm Tap',  emoji: '🥁', sense: 'Sound & Touch',   tagline: 'Watch the beat, then tap it back!',  bgColor: '#B71C1C', border: '#EF9A9A' },
  { id: 'bubble'  as GameId, title: 'Bubble Pop',  emoji: '🫧', sense: 'Touch & Visual',  tagline: 'Pop only the matching bubbles!',     bgColor: '#01579B', border: '#81D4FA' },
  { id: 'texture' as GameId, title: 'Feel & Find', emoji: '🤚', sense: 'Touch',           tagline: 'Find the right texture!',            bgColor: '#1B5E20', border: '#A5D6A7' },
];

// ── Colour Mix data ───────────────────────────────────────────────────────────
const PALETTE = [
  { name: 'Red',    hex: '#E53935' },
  { name: 'Blue',   hex: '#1E88E5' },
  { name: 'Yellow', hex: '#FFD600' },
  { name: 'Green',  hex: '#43A047' },
  { name: 'White',  hex: '#F5F5F5' },
  { name: 'Black',  hex: '#424242' },
];
const MIX_ROUNDS = [
  { c1: 'Red',   c2: 'Blue',   result: '#7B1FA2', name: 'Purple'     },
  { c1: 'Red',   c2: 'Yellow', result: '#FF6F00', name: 'Orange'     },
  { c1: 'Blue',  c2: 'Yellow', result: '#388E3C', name: 'Green'      },
  { c1: 'Red',   c2: 'White',  result: '#F48FB1', name: 'Pink'       },
  { c1: 'Blue',  c2: 'White',  result: '#90CAF9', name: 'Light Blue' },
  { c1: 'Black', c2: 'White',  result: '#9E9E9E', name: 'Gray'       },
  { c1: 'Red',   c2: 'Green',  result: '#827717', name: 'Olive'      },
  { c1: 'Blue',  c2: 'Green',  result: '#00897B', name: 'Teal'       },
];
const MIX_LEVEL_ROUNDS = [3, 4, 5, 6, 8];

// ── Rhythm Tap data ───────────────────────────────────────────────────────────
const PADS = [
  { id: 0, color: '#E53935', dim: '#7B1C1C', label: '🔴' },
  { id: 1, color: '#FFD600', dim: '#7B6900', label: '🟡' },
  { id: 2, color: '#43A047', dim: '#1B5E20', label: '🟢' },
  { id: 3, color: '#1E88E5', dim: '#0D47A1', label: '🔵' },
];
const RHYTHM_LENGTHS = [3, 4, 5, 6, 7];

// ── Bubble Pop data ───────────────────────────────────────────────────────────
const BUBBLE_EMOJIS = ['🐙', '🐠', '🦋', '🐸', '⭐', '🌸', '🦕', '🍎', '🐝', '🦄'];
const BUBBLE_CFG = [
  { total: 9,  targets: 3 },
  { total: 12, targets: 4 },
  { total: 12, targets: 5 },
  { total: 15, targets: 5 },
  { total: 15, targets: 6 },
];

// ── Feel & Find data ──────────────────────────────────────────────────────────
const TEXTURE_QS = [
  { q: 'Which feels SOFT?',        correct: '🧸', opts: ['🧸', '🪨', '🌵', '🧊'] },
  { q: 'Which feels ROUGH?',       correct: '🪨', opts: ['🧸', '🪨', '🌸', '💧'] },
  { q: 'Which one is WET?',        correct: '💧', opts: ['🪨', '💧', '🧸', '🌵'] },
  { q: 'Which one is COLD?',       correct: '🧊', opts: ['🔥', '🧊', '🌵', '🧸'] },
  { q: 'Which is PRICKLY?',        correct: '🌵', opts: ['🧸', '💧', '🌵', '🧊'] },
  { q: 'Which is FLUFFY?',         correct: '☁️', opts: ['☁️', '🪨', '💧', '🌵'] },
  { q: 'Which one is HOT?',        correct: '🔥', opts: ['🔥', '🧊', '💧', '🧸'] },
  { q: 'Which is STICKY?',         correct: '🍯', opts: ['🍯', '🪨', '🧊', '🌵'] },
  { q: 'Which SINKS in water?',    correct: '🪨', opts: ['🪨', '☁️', '🧸', '🌵'] },
  { q: 'Which one FLOATS?',        correct: '☁️', opts: ['☁️', '🪨', '🍯', '🧊'] },
];
const TEXTURE_LEVEL_QS = [3, 4, 6, 8, 10];

// ── Shared sound helpers ──────────────────────────────────────────────────────
async function playSound(player: ReturnType<typeof useAudioPlayer>) {
  try { await player.seekTo(0); player.play(); } catch (_) {}
}

// ── Win Banner ────────────────────────────────────────────────────────────────
function WinBanner({ emoji, msg, isLast }: { emoji: string; msg: string; isLast: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 72 }}>{emoji}</Text>
      <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFD700' }}>
        {isLast ? 'All Levels Done! 🏆' : 'Level Complete! 🎉'}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.75)' }}>{msg}</Text>
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
        {isLast ? 'Going back to games...' : 'Next level loading...'}
      </Text>
    </View>
  );
}

// ── Colour Mix Game ───────────────────────────────────────────────────────────
function ColourMixGame({
  level, scale, isLast, onLevelWin, onCorrect, onWrong,
}: { level: number; scale: number; isLast: boolean; onLevelWin: () => void; onCorrect: () => void; onWrong: () => void }) {
  const total = MIX_LEVEL_ROUNDS[level];
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [flash, setFlash] = useState<'none' | 'ok' | 'bad'>('none');
  const [won, setWon] = useState(false);

  const mix = MIX_ROUNDS[round % MIX_ROUNDS.length];

  useEffect(() => {
    if (!won) return;
    const t = setTimeout(onLevelWin, 1800);
    return () => clearTimeout(t);
  }, [won]);

  const tapColor = (name: string) => {
    if (flash !== 'none' || won) return;
    const next = selected.includes(name)
      ? selected.filter(n => n !== name)
      : [...selected, name].slice(-2);
    setSelected(next);
    if (next.length === 2) {
      const [a, b] = next;
      const ok = (a === mix.c1 && b === mix.c2) || (a === mix.c2 && b === mix.c1);
      setFlash(ok ? 'ok' : 'bad');
      if (ok) onCorrect(); else onWrong();
      setTimeout(() => {
        setFlash('none');
        setSelected([]);
        if (ok) {
          if (round + 1 >= total) setWon(true);
          else setRound(r => r + 1);
        }
      }, ok ? 700 : 500);
    }
  };

  return (
    <View style={cg.wrap}>
      {won ? <WinBanner emoji="🎨" msg="Brilliant colour mixing!" isLast={isLast} /> : (
        <>
          <Text style={[cg.prog, { fontSize: 11 * scale }]}>Round {round + 1} / {total}</Text>
          <View style={[cg.target, { backgroundColor: mix.result, borderColor: flash === 'ok' ? '#4CAF50' : flash === 'bad' ? '#E53935' : '#ffffff44' }]}>
            <Text style={[cg.targetLabel, { fontSize: 11 * scale }]}>Make this colour:</Text>
            <Text style={[cg.targetName, { fontSize: 22 * scale }]}>{mix.name}</Text>
          </View>
          <Text style={[cg.hint, { fontSize: 11 * scale }]}>Tap TWO colours to mix them!</Text>
          <View style={cg.palette}>
            {PALETTE.map(p => {
              const sel = selected.includes(p.name);
              return (
                <TouchableOpacity key={p.name}
                  style={[cg.swatch, { backgroundColor: p.hex, borderColor: sel ? '#FFD700' : 'rgba(255,255,255,0.3)', borderWidth: sel ? 5 : 2, transform: [{ scale: sel ? 1.12 : 1 }] }]}
                  onPress={() => tapColor(p.name)} activeOpacity={0.8}
                >
                  <Text style={[cg.swatchName, { fontSize: 9 * scale, color: ['White', 'Yellow'].includes(p.name) ? '#333' : '#fff' }]}>{p.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={cg.mixRow}>
            {selected.map(n => <View key={n} style={[cg.mixDot, { backgroundColor: PALETTE.find(p => p.name === n)!.hex }]} />)}
            {selected.length === 0 && <Text style={cg.mixHint}>Select two colours above ↑</Text>}
            {selected.length === 1 && <Text style={cg.plus}>+ ?</Text>}
            {selected.length === 2 && <Text style={cg.plus}>= 🎨</Text>}
          </View>
        </>
      )}
    </View>
  );
}

// ── Rhythm Tap Game ───────────────────────────────────────────────────────────
function RhythmTapGame({
  level, scale, isLast, isTablet, onLevelWin, onCorrect, onWrong,
}: { level: number; scale: number; isLast: boolean; isTablet: boolean; onLevelWin: () => void; onCorrect: () => void; onWrong: () => void }) {
  const seqLen = RHYTHM_LENGTHS[level];
  const ROUNDS = 3;
  const [round, setRound] = useState(1);
  const [seq, setSeq] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<'showing' | 'tapping' | 'fail' | 'roundWin' | 'won'>('showing');
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [flashPad, setFlashPad] = useState<{ id: number; ok: boolean } | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const showSeq = useCallback((sequence: number[]) => {
    setPhase('showing');
    setPlayerSeq([]);
    setHighlighted(null);
    let d = 500;
    sequence.forEach(id => {
      setTimeout(() => { if (alive.current) setHighlighted(id); }, d);
      setTimeout(() => { if (alive.current) setHighlighted(null); }, d + 480);
      d += 850;
    });
    setTimeout(() => { if (alive.current) { setPhase('tapping'); setHighlighted(null); } }, d + 100);
  }, []);

  const startRound = useCallback((r: number) => {
    const s = Array.from({ length: seqLen }, () => Math.floor(Math.random() * 4));
    setSeq(s);
    setRound(r);
    showSeq(s);
  }, [seqLen, showSeq]);

  useEffect(() => { startRound(1); }, []);

  useEffect(() => {
    if (phase !== 'won') return;
    const t = setTimeout(onLevelWin, 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const tapPad = useCallback((padId: number) => {
    if (phase !== 'tapping') return;
    const idx = playerSeq.length;
    const ok = seq[idx] === padId;
    setFlashPad({ id: padId, ok });
    setTimeout(() => { if (alive.current) setFlashPad(null); }, 280);
    if (!ok) {
      onWrong();
      setPhase('fail');
      setTimeout(() => { if (alive.current) showSeq(seq); }, 1100);
      return;
    }
    onCorrect();
    const next = [...playerSeq, padId];
    setPlayerSeq(next);
    if (next.length === seq.length) {
      if (round >= ROUNDS) {
        setPhase('won');
      } else {
        setPhase('roundWin');
        setTimeout(() => { if (alive.current) startRound(round + 1); }, 800);
      }
    }
  }, [phase, playerSeq, seq, round, showSeq, startRound, onCorrect, onWrong]);

  const phaseMsg =
    phase === 'showing'  ? '👀 Watch the pattern...' :
    phase === 'tapping'  ? '👆 Now tap it back!' :
    phase === 'fail'     ? '❌ Oops! Watch again...' :
    phase === 'roundWin' ? '✅ Great! Next round...' : '';

  const padSize = isTablet ? 120 : 80;
  const padGap  = isTablet ? 16  : 10;
  const wrapGap = isTablet ? 12  : 6;

  return (
    <View style={[rg.wrap, { gap: wrapGap }]}>
      {phase === 'won' ? <WinBanner emoji="🥁" msg="Perfect rhythm!" isLast={isLast} /> : (
        <>
          <Text style={[rg.prog, { fontSize: 11 * scale }]}>Round {round} / {ROUNDS} · {seqLen} beats</Text>
          <Text style={[rg.msg, { fontSize: 13 * scale }]}>{phaseMsg}</Text>
          <View style={rg.dots}>
            {seq.map((_, i) => (
              <View key={i} style={[rg.dot, { backgroundColor: i < playerSeq.length ? '#4CAF50' : 'rgba(255,255,255,0.2)' }]} />
            ))}
          </View>
          <View style={[rg.grid, { gap: padGap, maxWidth: padSize * 2 + padGap + 4 }]}>
            {PADS.map(pad => {
              const lit = highlighted === pad.id;
              const fl = flashPad?.id === pad.id;
              return (
                <TouchableOpacity key={pad.id}
                  style={[rg.pad, {
                    width: padSize, height: padSize,
                    backgroundColor: lit || fl ? pad.color : pad.dim,
                    shadowColor: pad.color,
                    shadowOpacity: lit ? 0.9 : 0.25,
                    transform: [{ scale: lit ? 1.1 : 1 }],
                  }]}
                  onPress={() => tapPad(pad.id)} activeOpacity={0.75}
                >
                  <Text style={{ fontSize: padSize * 0.38 }}>{pad.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

// ── Bubble Pop Game ───────────────────────────────────────────────────────────
type Bubble = { id: string; emoji: string; popped: boolean; wrong: boolean };

function BubblePopGame({
  level, scale, isLast, onLevelWin, onCorrect, onWrong,
}: { level: number; scale: number; isLast: boolean; onLevelWin: () => void; onCorrect: () => void; onWrong: () => void }) {
  const cfg = BUBBLE_CFG[level];
  const ROUNDS = 3;
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [won, setWon] = useState(false);

  const buildRound = useCallback(() => {
    const tgt = BUBBLE_EMOJIS[Math.floor(Math.random() * 5)];
    setTarget(tgt);
    const arr: Bubble[] = [];
    for (let i = 0; i < cfg.targets; i++) arr.push({ id: `t${i}`, emoji: tgt, popped: false, wrong: false });
    const others = BUBBLE_EMOJIS.filter(e => e !== tgt);
    for (let i = 0; i < cfg.total - cfg.targets; i++) arr.push({ id: `o${i}`, emoji: others[i % others.length], popped: false, wrong: false });
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setBubbles(arr);
  }, [cfg]);

  useEffect(() => { buildRound(); }, []);

  useEffect(() => {
    if (!won) return;
    const t = setTimeout(onLevelWin, 1800);
    return () => clearTimeout(t);
  }, [won]);

  const pop = useCallback((id: string) => {
    setBubbles(prev => {
      const b = prev.find(x => x.id === id);
      if (!b || b.popped || b.wrong) return prev;
      if (b.emoji === target) {
        onCorrect();
        const next = prev.map(x => x.id === id ? { ...x, popped: true } : x);
        if (next.filter(x => x.emoji === target && !x.popped).length === 0) {
          setTimeout(() => {
            if (round >= ROUNDS) setWon(true);
            else { setRound(r => r + 1); buildRound(); }
          }, 400);
        }
        return next;
      }
      onWrong();
      const next = prev.map(x => x.id === id ? { ...x, wrong: true } : x);
      setTimeout(() => setBubbles(c => c.map(x => x.id === id ? { ...x, wrong: false } : x)), 450);
      return next;
    });
  }, [target, round, buildRound, onCorrect, onWrong]);

  const remaining = bubbles.filter(b => b.emoji === target && !b.popped).length;

  return (
    <View style={bp.wrap}>
      {won ? <WinBanner emoji="🫧" msg="All bubbles popped!" isLast={isLast} /> : (
        <>
          <Text style={[bp.prog, { fontSize: 11 * scale }]}>Round {round} / {ROUNDS}</Text>
          <View style={bp.targetRow}>
            <Text style={[bp.targetTxt, { fontSize: 13 * scale }]}>Pop all</Text>
            <Text style={{ fontSize: 30 }}>{target}</Text>
            <Text style={[bp.targetTxt, { fontSize: 13 * scale }]}>bubbles · {remaining} left!</Text>
          </View>
          <View style={bp.grid}>
            {bubbles.map(b => (
              <TouchableOpacity key={b.id}
                style={[bp.bubble, b.popped && bp.bubbleGone, b.wrong && bp.bubbleWrong]}
                onPress={() => pop(b.id)} activeOpacity={0.75} disabled={b.popped}
              >
                {!b.popped && <Text style={{ fontSize: 26 }}>{b.emoji}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── Feel & Find Game ──────────────────────────────────────────────────────────
function FeelFindGame({
  level, scale, isLast, onLevelWin, onCorrect, onWrong,
}: { level: number; scale: number; isLast: boolean; onLevelWin: () => void; onCorrect: () => void; onWrong: () => void }) {
  const total = TEXTURE_LEVEL_QS[level];
  const [idx, setIdx] = useState(0);
  const [flash, setFlash] = useState<{ opt: string; ok: boolean } | null>(null);
  const [won, setWon] = useState(false);

  const q = TEXTURE_QS[idx % TEXTURE_QS.length];
  const shuffledOpts = useMemo(() => [...q.opts].sort(() => Math.random() - 0.5), [q]);

  useEffect(() => {
    if (!won) return;
    const t = setTimeout(onLevelWin, 1800);
    return () => clearTimeout(t);
  }, [won]);

  const tap = (opt: string) => {
    if (flash || won) return;
    const ok = opt === q.correct;
    setFlash({ opt, ok });
    if (ok) onCorrect(); else onWrong();
    setTimeout(() => {
      setFlash(null);
      if (ok) {
        if (idx + 1 >= total) setWon(true);
        else setIdx(i => i + 1);
      }
    }, ok ? 700 : 500);
  };

  return (
    <View style={ff.wrap}>
      {won ? <WinBanner emoji="🤚" msg="Great texture sense!" isLast={isLast} /> : (
        <>
          <Text style={[ff.prog, { fontSize: 11 * scale }]}>Question {idx + 1} / {total}</Text>
          <Text style={[ff.q, { fontSize: 18 * scale }]}>{q.q}</Text>
          <View style={ff.optsGrid}>
            {shuffledOpts.map(opt => {
              const f = flash?.opt === opt;
              return (
                <TouchableOpacity key={opt}
                  style={[ff.opt, f && { backgroundColor: flash!.ok ? '#1B5E20' : '#B71C1C', borderColor: flash!.ok ? '#A5D6A7' : '#EF9A9A' }]}
                  onPress={() => tap(opt)} activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 50 }}>{opt}</Text>
                  {f && <Text style={{ fontSize: 20, position: 'absolute', bottom: 4 }}>{flash!.ok ? '✅' : '❌'}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SensoryGamesPage() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [level, setLevel] = useState(0);

  const winPlayer     = useAudioPlayer(SND_WIN);
  const correctPlayer = useAudioPlayer(SND_CORRECT);
  const wrongPlayer   = useAudioPlayer(SND_WRONG);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const { width } = dims;
  const scale = getScale(width);
  const isTablet = width >= 800;
  const gameDef = GAMES.find(g => g.id === activeGame);

  const handleCorrect = useCallback(() => playSound(correctPlayer), [correctPlayer]);
  const handleWrong   = useCallback(() => playSound(wrongPlayer),   [wrongPlayer]);

  const handleLevelWin = useCallback(() => {
    playSound(winPlayer);
    if (level >= 4) {
      // All 5 levels done — return to game picker
      setTimeout(() => { setLevel(0); setActiveGame(null); }, 1800);
    } else {
      setLevel(l => l + 1);
    }
  }, [level, winPlayer]);

  const handleBack = () => { setActiveGame(null); setLevel(0); };

  const isLast = level >= 4;

  return (
    <View style={s.screen}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: gameDef?.bgColor ?? '#4A148C' }]}>
        <TouchableOpacity style={s.navBtn} onPress={activeGame ? handleBack : () => router.replace('/')} activeOpacity={0.85}>
          <Text style={{ fontSize: 13 * scale, color: '#fff', fontWeight: '800' }}>
            {activeGame ? '← Games' : '🏠'}
          </Text>
        </TouchableOpacity>
        <View style={s.hdrCenter}>
          <Text style={[s.hdrTitle, { fontSize: 17 * scale }]}>
            {gameDef ? `${gameDef.emoji} ${gameDef.title}` : '🌈 Sensory Games'}
          </Text>
          <Text style={[s.hdrSub, { fontSize: 9 * scale }]}>
            {gameDef
              ? `Level ${level + 1} / 5 · ${gameDef.sense}`
              : 'Choose a sensory game to play!'}
          </Text>
        </View>
        <View style={s.navBtn} />
      </View>

      {/* Level pills */}
      {activeGame && (
        <View style={s.levelRow}>
          {[0, 1, 2, 3, 4].map(l => (
            <TouchableOpacity key={l}
              style={[s.lvPill, l === level && { backgroundColor: gameDef!.border }]}
              onPress={() => setLevel(l)} activeOpacity={0.8}
            >
              <Text style={[s.lvTxt, { fontSize: 10 * scale }, l === level && { color: '#1A1A2E' }]}>Lv {l + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Game picker — 2 × 2 columns */}
      {!activeGame ? (
        <View style={s.pickerCols}>
          <View style={s.pickerCol}>
            {GAMES.slice(0, 2).map(g => (
              <TouchableOpacity key={g.id}
                style={[s.gameCard, { backgroundColor: g.bgColor, borderColor: g.border }]}
                onPress={() => { setActiveGame(g.id); setLevel(0); }} activeOpacity={0.85}
              >
                <Text style={{ fontSize: 44 }}>{g.emoji}</Text>
                <Text style={[s.cardTitle, { fontSize: 14 * scale }]}>{g.title}</Text>
                <Text style={[s.cardSense, { fontSize: 9 * scale }]}>{g.sense}</Text>
                <Text style={[s.cardTagline, { fontSize: 10 * scale }]}>{g.tagline}</Text>
                <View style={[s.badge, { borderColor: g.border }]}>
                  <Text style={[s.badgeTxt, { fontSize: 9 * scale }]}>▶ 5 Levels</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.pickerCol}>
            {GAMES.slice(2, 4).map(g => (
              <TouchableOpacity key={g.id}
                style={[s.gameCard, { backgroundColor: g.bgColor, borderColor: g.border }]}
                onPress={() => { setActiveGame(g.id); setLevel(0); }} activeOpacity={0.85}
              >
                <Text style={{ fontSize: 44 }}>{g.emoji}</Text>
                <Text style={[s.cardTitle, { fontSize: 14 * scale }]}>{g.title}</Text>
                <Text style={[s.cardSense, { fontSize: 9 * scale }]}>{g.sense}</Text>
                <Text style={[s.cardTagline, { fontSize: 10 * scale }]}>{g.tagline}</Text>
                <View style={[s.badge, { borderColor: g.border }]}>
                  <Text style={[s.badgeTxt, { fontSize: 9 * scale }]}>▶ 5 Levels</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={s.gameArea}>
          {activeGame === 'colour'  && <ColourMixGame  key={`cm-${level}`} level={level} scale={scale} isLast={isLast} onLevelWin={handleLevelWin} onCorrect={handleCorrect} onWrong={handleWrong} />}
          {activeGame === 'rhythm'  && <RhythmTapGame  key={`rt-${level}`} level={level} scale={scale} isLast={isLast} isTablet={isTablet} onLevelWin={handleLevelWin} onCorrect={handleCorrect} onWrong={handleWrong} />}
          {activeGame === 'bubble'  && <BubblePopGame  key={`bp-${level}`} level={level} scale={scale} isLast={isLast} onLevelWin={handleLevelWin} onCorrect={handleCorrect} onWrong={handleWrong} />}
          {activeGame === 'texture' && <FeelFindGame   key={`ff-${level}`} level={level} scale={scale} isLast={isLast} onLevelWin={handleLevelWin} onCorrect={handleCorrect} onWrong={handleWrong} />}
        </View>
      )}

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A1A2E', padding: 12, gap: 8 },
  header: {
    height: 52, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 14, gap: 10,
  },
  navBtn: {
    minWidth: 70, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 10,
  },
  hdrCenter: { flex: 1, alignItems: 'center' },
  hdrTitle: { fontWeight: '900', color: '#FFD700', letterSpacing: 0.3 },
  hdrSub: { color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  levelRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  lvPill: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  lvTxt: { color: 'rgba(255,255,255,0.8)', fontWeight: '800' },
  pickerCols: { flex: 1, flexDirection: 'row', gap: 14 },
  pickerCol: { flex: 1, gap: 14 },
  gameCard: {
    flex: 1, borderRadius: 22, borderWidth: 3, alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
  cardTitle: { fontWeight: '900', color: '#FFD700', textAlign: 'center' },
  cardSense: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },
  cardTagline: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' },
  badge: {
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 4,
  },
  badgeTxt: { color: '#fff', fontWeight: '800' },
  gameArea: { flex: 1 },
});

const cg = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  prog: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },
  target: {
    width: 210, height: 88, borderRadius: 20, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center', gap: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  targetLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  targetName: { fontWeight: '900', color: '#fff' },
  hint: { color: 'rgba(255,255,255,0.55)', fontWeight: '700' },
  palette: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  swatch: {
    width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 6,
  },
  swatchName: { fontWeight: '900' },
  mixRow: { flexDirection: 'row', gap: 10, alignItems: 'center', height: 40 },
  mixDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  plus: { color: '#fff', fontSize: 20, fontWeight: '800' },
  mixHint: { color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 12 },
});

const rg = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  prog: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },
  msg: { fontWeight: '800', color: '#FFD700', textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  pad: {
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12,
  },
});

const bp = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  prog: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetTxt: { color: '#fff', fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 500 },
  bubble: {
    width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  bubbleGone: { backgroundColor: 'transparent', borderColor: 'transparent' },
  bubbleWrong: { backgroundColor: 'rgba(229,57,53,0.35)', borderColor: '#E53935' },
});

const ff = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  prog: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },
  q: { fontWeight: '900', color: '#FFD700', textAlign: 'center', paddingHorizontal: 20 },
  optsGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  opt: {
    width: 110, height: 110, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
});
