import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  onDone: () => void;
};

const ICONS = ['🌈', '🧩', '🗂️', '⭐', '🎮', '🌟'];

export default function SplashScreen({ onDone }: Props) {
  const { width } = Dimensions.get('window');

  // Main logo animations
  const logoScale  = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Floating icon animations
  const iconAnims = useRef(
    ICONS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(20),
      scale: new Animated.Value(0.5),
    })),
  ).current;

  useEffect(() => {
    // 1) Pop in the logo
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      // 2) Slide in title
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        // 3) Fade in subtitle
        Animated.timing(subOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
          // 4) Stagger floating icons
          Animated.stagger(
            90,
            iconAnims.map(anim =>
              Animated.parallel([
                Animated.timing(anim.opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(anim.scale, { toValue: 1, friction: 5, useNativeDriver: true }),
                Animated.timing(anim.y, { toValue: 0, duration: 280, useNativeDriver: true }),
              ]),
            ),
          ).start(() => {
            // 5) Hold 1.2s, then fade out the whole screen
            setTimeout(() => {
              Animated.timing(screenOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }).start(onDone);
            }, 1200);
          });
        });
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>

      {/* Floating background icons */}
      <View style={styles.floatingRow}>
        {ICONS.map((icon, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.floatingIcon,
              {
                opacity: iconAnims[i].opacity,
                transform: [
                  { translateY: iconAnims[i].y },
                  { scale: iconAnims[i].scale },
                ],
              },
            ]}
          >
            {icon}
          </Animated.Text>
        ))}
      </View>

      {/* Center content */}
      <View style={styles.center}>
        {/* Logo pop */}
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Animated.Text
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleY }] },
          ]}
        >
          ThinkiTiles
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.subtitle, { opacity: subOpacity }]}>
          Learn · Play · Grow
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, { opacity: subOpacity }]}>
          {[0, 1, 2].map(i => (
            <PulseDot key={i} delay={i * 180} />
          ))}
        </Animated.View>
      </View>

    </Animated.View>
  );
}

// Animated pulsing dot
function PulseDot({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, { toValue: 1.6, duration: 350, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D2463',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  floatingRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    opacity: 0.18,
  },
  floatingIcon: {
    fontSize: 64,
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 36,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E1BEE7',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
});
