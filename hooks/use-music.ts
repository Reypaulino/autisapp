import { useEffect, useState, useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

// ── Tracks ────────────────────────────────────────────────────────────────────
// Replace uri entries with local require() once you add your own .mp3 files:
//   source: require('@/assets/sounds/background.mp3')
export const TRACKS = [
  {
    name: 'Happy Kids',
    source: { uri: 'https://cdn.pixabay.com/audio/2023/06/19/audio_663dc41b11.mp3' },
  },
  {
    name: 'Playful',
    source: { uri: 'https://cdn.pixabay.com/audio/2022/10/16/audio_9e0d547d43.mp3' },
  },
  {
    name: 'Adventure',
    source: { uri: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3' },
  },
];

// ── Shared mutable state (module-level singleton) ──────────────────────────────
let _muted = false;
let _trackIndex = 0;
let _listeners: Array<(muted: boolean, track: number) => void> = [];

function notify() {
  _listeners.forEach(fn => fn(_muted, _trackIndex));
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useMusic() {
  const [muted, setMuted] = useState(_muted);
  const [trackIndex, setTrackIndex] = useState(_trackIndex);

  const player = useAudioPlayer(TRACKS[trackIndex].source);
  const status = useAudioPlayerStatus(player);

  // Configure audio mode once on mount
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Start looping when player is ready
  useEffect(() => {
    if (!player) return;
    player.loop = true;
    player.volume = 0.45;
    if (!_muted) {
      player.play();
    }
  }, [player]);

  // Sync mute state to player
  useEffect(() => {
    if (!player) return;
    player.muted = _muted;
  }, [player, muted]);

  // Subscribe to shared state changes
  useEffect(() => {
    const listener = (m: boolean, t: number) => {
      setMuted(m);
      setTrackIndex(t);
    };
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const toggleMute = useCallback(() => {
    _muted = !_muted;
    if (player) player.muted = _muted;
    notify();
  }, [player]);

  const nextTrack = useCallback(() => {
    _trackIndex = (_trackIndex + 1) % TRACKS.length;
    notify();
  }, []);

  const prevTrack = useCallback(() => {
    _trackIndex = (_trackIndex - 1 + TRACKS.length) % TRACKS.length;
    notify();
  }, []);

  return {
    muted,
    trackIndex,
    trackName: TRACKS[trackIndex].name,
    totalTracks: TRACKS.length,
    toggleMute,
    nextTrack,
    prevTrack,
  };
}
