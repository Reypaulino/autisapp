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

// ── Types ─────────────────────────────────────────────────────────────────────
type Activity = {
  id: string;
  title: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  category: string;
  duration: string;
  skill: string;
  steps: string[];
  tip: string;
};

// ── Activity data ─────────────────────────────────────────────────────────────
const ACTIVITIES: Activity[] = [
  {
    id: 'bubble_count', title: 'Bubble Counting', emoji: '🫧',
    bgColor: '#0277BD', borderColor: '#FFD700', shadowColor: '#01579B',
    category: 'Math', duration: '5 min', skill: 'Counting',
    steps: ['Blow bubbles into the air!', 'Count each bubble out loud: 1, 2, 3…', 'Clap when you pop one!', 'Try to count to 10 before they pop!'],
    tip: '💡 Use different colours of bubbles if you can!',
  },
  {
    id: 'animal_walk', title: 'Animal Walk', emoji: '🐘',
    bgColor: '#2E7D32', borderColor: '#FFEB3B', shadowColor: '#1B5E20',
    category: 'Movement', duration: '5 min', skill: 'Gross Motor',
    steps: ['Choose an animal from the cards below!', 'Walk around the room like that animal!', 'Make the sound of the animal!', 'Switch to a new animal every 30 seconds!'],
    tip: '💡 Try a bear crawl, bunny hop, or frog jump!',
  },
  {
    id: 'color_sort', title: 'Colour Sorting', emoji: '🎨',
    bgColor: '#E65100', borderColor: '#FFD700', shadowColor: '#BF360C',
    category: 'Cognitive', duration: '8 min', skill: 'Sorting',
    steps: ['Gather coloured objects from around the room!', 'Place red things in one pile!', 'Place blue things in another!', 'Keep sorting until all colours have a pile!'],
    tip: '💡 Use toys, crayons, socks — anything works!',
  },
  {
    id: 'simon_says', title: 'Simon Says', emoji: '🙋',
    bgColor: '#6A1B9A', borderColor: '#CE93D8', shadowColor: '#4A148C',
    category: 'Listening', duration: '10 min', skill: 'Attention',
    steps: ['One person is "Simon"!', 'Simon gives instructions: "Simon says touch your nose!"', 'Everyone follows ONLY if "Simon says" first!', 'If Simon doesn\'t say it — don\'t do it!'],
    tip: '💡 Start slow, then speed up for extra fun!',
  },
  {
    id: 'shape_hunt', title: 'Shape Hunt', emoji: '🔷',
    bgColor: '#AD1457', borderColor: '#FFD700', shadowColor: '#880E4F',
    category: 'Visual', duration: '10 min', skill: 'Recognition',
    steps: ['Pick a shape — circle, square, or triangle!', 'Walk around and find that shape in the room!', 'Tap it when you find one!', 'Count how many you found!'],
    tip: '💡 Windows, plates, and clocks are great spots to look!',
  },
  {
    id: 'freeze_dance', title: 'Freeze Dance', emoji: '🕺',
    bgColor: '#00695C', borderColor: '#FFD700', shadowColor: '#004D40',
    category: 'Movement', duration: '8 min', skill: 'Body Awareness',
    steps: ['Play your favourite song!', 'Dance and move around freely!', 'When the music stops — FREEZE!', 'Stay still until music starts again!'],
    tip: '💡 Try freezing in funny poses!',
  },
  {
    id: 'letter_trace', title: 'Letter Tracing', emoji: '✏️',
    bgColor: '#1565C0', borderColor: '#FFD700', shadowColor: '#0D47A1',
    category: 'Writing', duration: '10 min', skill: 'Fine Motor',
    steps: ['Pick a letter of the alphabet!', 'Trace it in the air with your finger!', 'Then trace it on paper!', 'Draw something that starts with that letter!'],
    tip: '💡 A, B, C — start with your name letters!',
  },
  {
    id: 'breathing', title: 'Calm Breathing', emoji: '🌬️',
    bgColor: '#4527A0', borderColor: '#CE93D8', shadowColor: '#311B92',
    category: 'Mindfulness', duration: '3 min', skill: 'Self-Regulation',
    steps: ['Sit in a comfortable spot!', 'Take a big breath IN for 4 counts!', 'Hold it for 2 counts!', 'Breathe OUT slowly for 4 counts! Repeat 5 times.'],
    tip: '💡 Imagine smelling flowers in, blowing candles out!',
  },
  {
    id: 'rhyme_time', title: 'Rhyme Time', emoji: '🎶',
    bgColor: '#37474F', borderColor: '#FFD700', shadowColor: '#263238',
    category: 'Language', duration: '8 min', skill: 'Phonics',
    steps: ['Say a simple word like "cat"!', 'Think of words that rhyme: bat, hat, mat!', 'Clap for each rhyming word you find!', 'Switch to a new word and try again!'],
    tip: '💡 Silly words count too — zat, brat, spat!',
  },
  {
    id: 'mirror_me', title: 'Mirror Me!', emoji: '🪞',
    bgColor: '#BF360C', borderColor: '#FFD700', shadowColor: '#870000',
    category: 'Social', duration: '5 min', skill: 'Imitation',
    steps: ['Face a partner or look in a mirror!', 'One person makes a slow movement!', 'The other person copies it exactly!', 'Switch roles after 1 minute!'],
    tip: '💡 Try facial expressions too — happy, sad, surprised!',
  },
  {
    id: 'pattern_copy', title: 'Pattern Copy', emoji: '🔴',
    bgColor: '#00838F', borderColor: '#FFD700', shadowColor: '#006064',
    category: 'Cognitive', duration: '8 min', skill: 'Patterns',
    steps: ['Lay out coloured blocks or beads in a pattern!', 'For example: red, blue, red, blue…', 'Ask your child to copy the pattern!', 'Then let them make their own for you to copy!'],
    tip: '💡 Use stickers, Legos, or even fruit!',
  },
  {
    id: 'story_time', title: 'Story Builder', emoji: '📖',
    bgColor: '#558B2F', borderColor: '#FFD700', shadowColor: '#33691E',
    category: 'Language', duration: '10 min', skill: 'Imagination',
    steps: ['Start a story with one sentence: "Once upon a time…"', 'Take turns adding one sentence each!', 'Include a character, a place, and a problem!', 'Work together to find a happy ending!'],
    tip: '💡 Draw pictures of your story after!',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Movement', 'Cognitive', 'Language', 'Mindfulness', 'Social', 'Math', 'Listening', 'Visual', 'Writing'];

function getScale(w: number) {
  if (w >= 1300) return 1.35;
  if (w >= 1000) return 1.15;
  if (w >= 800)  return 1.0;
  return 0.85;
}

const PAD = 12;
const HDR = 52;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const detailAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const { width } = dims;
  const scale = getScale(width);
  const isTablet = width >= 800;

  const openActivity = (act: Activity) => {
    setSelectedActivity(act);
    Animated.spring(detailAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }).start();
  };

  const closeActivity = () => {
    Animated.timing(detailAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSelectedActivity(null));
  };

  const filtered = activeCategory === 'All' ? ACTIVITIES : ACTIVITIES.filter(a => a.category === activeCategory);

  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FF6F00' }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
          <Text style={{ fontSize: 18 * scale }}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>🎯 Activities</Text>
          <Text style={[styles.headerSub, { fontSize: 10 * scale }]}>Fun learning activities for every day!</Text>
        </View>
        <View style={styles.navBtn} />
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterPill, activeCategory === cat && styles.filterPillActive]}
            onPress={() => setActiveCategory(cat)} activeOpacity={0.8}
          >
            <Text style={[styles.filterText, { fontSize: 10 * scale }, activeCategory === cat && styles.filterTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main body */}
      <View style={styles.body}>

        {/* Activity grid */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {filtered.map(act => (
            <TouchableOpacity
              key={act.id}
              style={[styles.card, { backgroundColor: act.bgColor, borderColor: act.borderColor }]}
              onPress={() => openActivity(act)} activeOpacity={0.85}
            >
              <Text style={{ fontSize: isTablet ? 40 : 32 }}>{act.emoji}</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 * scale }]}>{act.title}</Text>
              <View style={styles.cardTagRow}>
                <View style={[styles.cardTag, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                  <Text style={[styles.cardTagText, { fontSize: 8.5 * scale }]}>{act.category}</Text>
                </View>
                <View style={[styles.cardTag, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                  <Text style={[styles.cardTagText, { fontSize: 8.5 * scale }]}>⏱ {act.duration}</Text>
                </View>
              </View>
              <Text style={[styles.cardSkill, { fontSize: 9 * scale }]}>✨ {act.skill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Detail panel */}
        {selectedActivity && (
          <Animated.View
            style={[
              styles.detailPanel,
              { borderColor: selectedActivity.borderColor },
              {
                opacity: detailAnim,
                transform: [{ scale: detailAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
              },
            ]}
          >
            {/* Detail header */}
            <View style={[styles.detailHeader, { backgroundColor: selectedActivity.bgColor }]}>
              <Text style={{ fontSize: 36 * scale }}>{selectedActivity.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { fontSize: 16 * scale }]}>{selectedActivity.title}</Text>
                <View style={styles.detailTagRow}>
                  <View style={[styles.detailTag, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                    <Text style={[styles.detailTagText, { fontSize: 9 * scale }]}>{selectedActivity.category}</Text>
                  </View>
                  <View style={[styles.detailTag, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                    <Text style={[styles.detailTagText, { fontSize: 9 * scale }]}>⏱ {selectedActivity.duration}</Text>
                  </View>
                  <View style={[styles.detailTag, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                    <Text style={[styles.detailTagText, { fontSize: 9 * scale }]}>✨ {selectedActivity.skill}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={closeActivity} activeOpacity={0.8}>
                <Text style={{ fontSize: 18, color: '#fff', fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Steps */}
            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.detailSectionLabel, { fontSize: 11 * scale }]}>📋 How to Play</Text>
              {selectedActivity.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: selectedActivity.bgColor }]}>
                    <Text style={[styles.stepNumText, { fontSize: 11 * scale }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { fontSize: 12 * scale }]}>{step}</Text>
                </View>
              ))}

              {/* Tip */}
              <View style={[styles.tipBox, { backgroundColor: selectedActivity.bgColor + '22', borderColor: selectedActivity.borderColor }]}>
                <Text style={[styles.tipText, { fontSize: 11 * scale }]}>{selectedActivity.tip}</Text>
              </View>

              {/* Animal cards for animal walk */}
              {selectedActivity.id === 'animal_walk' && (
                <View style={styles.animalCards}>
                  {['🐘 Elephant', '🐸 Frog', '🐻 Bear', '🦘 Kangaroo', '🦁 Lion', '🐢 Turtle'].map(a => (
                    <View key={a} style={[styles.animalCard, { backgroundColor: selectedActivity.bgColor + '33' }]}>
                      <Text style={{ fontSize: 18 * scale }}>{a.split(' ')[0]}</Text>
                      <Text style={[styles.animalName, { fontSize: 9 * scale }]}>{a.split(' ')[1]}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8E1', padding: PAD, gap: 8 },
  header: {
    height: HDR, flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingHorizontal: 14, gap: 8,
  },
  navBtn: {
    minWidth: 44, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 8,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: '900', color: '#FFD700', letterSpacing: 0.3 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 2, paddingVertical: 2 },
  filterPill: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(0,0,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)',
  },
  filterPillActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  filterText: { fontWeight: '700', color: '#5D4037' },
  filterTextActive: { color: '#fff' },
  body: { flex: 1, flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  card: {
    width: 130, borderRadius: 18, borderWidth: 2.5,
    padding: 12, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 5,
  },
  cardTitle: { fontWeight: '900', color: '#fff', textAlign: 'center' },
  cardTagRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  cardTag: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cardTagText: { color: '#fff', fontWeight: '700' },
  cardSkill: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
  // Detail panel
  detailPanel: {
    width: 300, backgroundColor: '#fff', borderRadius: 22, borderWidth: 2.5,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10,
  },
  detailTitle: { fontWeight: '900', color: '#FFD700' },
  detailTagRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  detailTag: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  detailTagText: { color: '#fff', fontWeight: '700' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  detailScroll: { flex: 1, padding: 14 },
  detailSectionLabel: { fontWeight: '900', color: '#333', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontWeight: '900' },
  stepText: { flex: 1, color: '#333', fontWeight: '600', lineHeight: 19 },
  tipBox: {
    borderRadius: 12, borderWidth: 2, padding: 12, marginTop: 6, marginBottom: 10,
  },
  tipText: { fontWeight: '700', color: '#333', lineHeight: 17 },
  animalCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  animalCard: {
    width: 70, height: 60, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', gap: 2,
  },
  animalName: { color: '#333', fontWeight: '700' },
});
