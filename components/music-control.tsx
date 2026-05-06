import React, { useState, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useMusic } from '@/hooks/use-music';

export default function MusicControl() {
  const { muted, trackName, trackIndex, totalTracks, toggleMute, nextTrack, prevTrack } = useMusic();
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, { toValue, useNativeDriver: false, friction: 7, tension: 80 }).start();
    setExpanded(!expanded);
  };

  const panelWidth = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [48, 220] });
  const panelOpacity = expandAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.panel, { width: panelWidth }]}>
        {/* Expand/collapse button — always visible */}
        <TouchableOpacity style={styles.iconBtn} onPress={toggle} activeOpacity={0.8}>
          <Text style={styles.iconText}>{expanded ? '🎵' : muted ? '🔇' : '🎵'}</Text>
        </TouchableOpacity>

        {/* Expanded controls */}
        <Animated.View style={[styles.controls, { opacity: panelOpacity }]}>
          {/* Mute toggle */}
          <TouchableOpacity style={styles.controlBtn} onPress={toggleMute} activeOpacity={0.8}>
            <Text style={styles.controlText}>{muted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>

          {/* Prev track */}
          <TouchableOpacity style={styles.controlBtn} onPress={prevTrack} activeOpacity={0.8}>
            <Text style={styles.controlText}>⏮</Text>
          </TouchableOpacity>

          {/* Track info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={1}>{muted ? 'Muted' : trackName}</Text>
            <Text style={styles.trackDot}>
              {Array.from({ length: totalTracks }).map((_, i) => i === trackIndex ? '●' : '○').join(' ')}
            </Text>
          </View>

          {/* Next track */}
          <TouchableOpacity style={styles.controlBtn} onPress={nextTrack} activeOpacity={0.8}>
            <Text style={styles.controlText}>⏭</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    zIndex: 999,
    alignItems: 'flex-end',
  },
  panel: {
    height: 48,
    backgroundColor: 'rgba(30,30,60,0.92)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  iconBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 22,
  },
  controls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 4,
  },
  controlBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  controlText: {
    fontSize: 15,
    color: '#fff',
  },
  trackInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
  },
  trackDot: {
    fontSize: 8,
    color: 'rgba(255,215,0,0.6)',
    marginTop: 1,
  },
});
