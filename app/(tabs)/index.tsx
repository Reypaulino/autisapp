import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

function getScale(width: number) {
  if (width >= 1300) return 1.4;
  if (width >= 1000) return 1.2;
  if (width >= 800)  return 1.05;
  return 1;
}

export default function HomeScreen() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const scale = getScale(dims.width);

  return (
    <View style={styles.screen}>

      {/* ── Left: Welcome section ── */}
      <View style={styles.leftPanel}>
        {/* App logo */}
        <Image
          source={require('@/assets/logo.png')}
          style={{ width: 120 * scale, height: 120 * scale, borderRadius: 24 }}
          resizeMode="contain"
        />

        <Text style={[styles.appName, { fontSize: 28 * scale }]}>ThinkiTiles</Text>
        <Text style={[styles.appTagline, { fontSize: 13 * scale }]}>
          Learn · Play · Grow{'\n'}Games for curious young minds!
        </Text>

        {/* Decorative badges */}
        <View style={styles.badgeRow}>
          {['🧠 Memory', '🗂️ Sorting', '⭐ Stars'].map(b => (
            <View key={b} style={styles.badge}>
              <Text style={[styles.badgeText, { fontSize: 11 * scale }]}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Right: Explore section ── */}
      <View style={styles.rightPanel}>
        <Text style={[styles.exploreLabel, { fontSize: 13 * scale }]}>
          Ready to play?
        </Text>

        {/* Big Explore Games button */}
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => router.push('/explore-games')}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 30 * scale }}>🎮</Text>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={[styles.exploreBtnTitle, { fontSize: 18 * scale }]}>Explore Games</Text>
            <Text style={[styles.exploreBtnSub, { fontSize: 11 * scale }]}>Memory · Sorting · Puzzle · More!</Text>
          </View>
          <View style={styles.exploreBtnArrow}>
            <Text style={[styles.arrowText, { fontSize: 13 * scale }]}>▶ Play!</Text>
          </View>
        </TouchableOpacity>

        {/* Learn & Play button */}
        <TouchableOpacity
          style={styles.learnBtn}
          onPress={() => router.push('/learn')}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 30 * scale }}>📚</Text>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={[styles.learnBtnTitle, { fontSize: 18 * scale }]}>Learn & Play</Text>
            <Text style={[styles.learnBtnSub, { fontSize: 11 * scale }]}>Activities · Sensory · More!</Text>
          </View>
          <View style={styles.learnBtnArrow}>
            <Text style={[styles.arrowText, { fontSize: 13 * scale }]}>▶ Learn!</Text>
          </View>
        </TouchableOpacity>

        {/* Quick-play pills */}
        <View style={styles.quickRow}>
          <Text style={[styles.quickLabel, { fontSize: 10 * scale }]}>Quick:</Text>
          <TouchableOpacity style={[styles.quickPill, { backgroundColor: '#1565C0' }]} onPress={() => router.push('/memory')} activeOpacity={0.85}>
            <Text style={[styles.quickPillText, { fontSize: 10 * scale }]}>🧩 Memory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickPill, { backgroundColor: '#E65100' }]} onPress={() => router.push('/sorting')} activeOpacity={0.85}>
            <Text style={[styles.quickPillText, { fontSize: 10 * scale }]}>🗂️ Sorting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickPill, { backgroundColor: '#FF6F00' }]} onPress={() => router.push('/activities')} activeOpacity={0.85}>
            <Text style={[styles.quickPillText, { fontSize: 10 * scale }]}>🎯 Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickPill, { backgroundColor: '#6A1B9A' }]} onPress={() => router.push('/sensory')} activeOpacity={0.85}>
            <Text style={[styles.quickPillText, { fontSize: 10 * scale }]}>🌈 Sensory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickPill, { backgroundColor: '#AD1457' }]} onPress={() => router.push('/coloring')} activeOpacity={0.85}>
            <Text style={[styles.quickPillText, { fontSize: 10 * scale }]}>🎨 Animals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickPill, { backgroundColor: '#0277BD' }]} onPress={() => router.push('/coloring-vehicles')} activeOpacity={0.85}>
            <Text style={[styles.quickPillText, { fontSize: 10 * scale }]}>🚗 Vehicles</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3E5F5',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  // Left panel
  leftPanel: {
    flex: 1.1,
    backgroundColor: '#7B1FA2',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
    shadowColor: '#4A148C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: {
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  appTagline: {
    color: '#E1BEE7',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  // Divider
  divider: {
    width: 3,
    backgroundColor: '#CE93D8',
    borderRadius: 3,
    marginVertical: 8,
  },
  // Right panel
  rightPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  exploreLabel: {
    fontWeight: '800',
    color: '#6A1B9A',
  },
  // Explore Games big button
  exploreBtn: {
    width: '100%',
    backgroundColor: '#43A047',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  exploreBtnTitle: {
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  exploreBtnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  exploreBtnArrow: {
    marginTop: 4,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  arrowText: {
    fontWeight: '900',
    color: '#2E7D32',
  },
  // Learn & Play button
  learnBtn: {
    width: '100%',
    backgroundColor: '#6A1B9A',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#4A148C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#4A148C',
  },
  learnBtnTitle: {
    fontWeight: '900',
    color: '#CE93D8',
    letterSpacing: 0.5,
  },
  learnBtnSub: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  learnBtnArrow: {
    backgroundColor: '#CE93D8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  // Quick-play pills
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickLabel: {
    color: '#6A1B9A',
    fontWeight: '700',
  },
  quickPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  quickPillText: {
    color: '#fff',
    fontWeight: '800',
  },
});
