import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, TouchableOpacity, Text, Dimensions, ScrollView, PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Ellipse, Rect, Defs, ClipPath, G, Polygon } from 'react-native-svg';

function getScale(w: number) {
  if (w >= 1300) return 1.3;
  if (w >= 1000) return 1.1;
  if (w >= 800)  return 1.0;
  return 0.85;
}

const PALETTE = [
  '#E53935', '#FF7043', '#FFD600', '#66BB6A',
  '#29B6F6', '#5C6BC0', '#AB47BC', '#FF80AB',
  '#A1887F', '#78909C', '#000000', '#FFFFFF',
];
const BRUSHES = [3, 7, 14, 22];

function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

type Stroke = { d: string; color: string; width: number };

type Animal = {
  id: string; name: string; emoji: string; bgColor: string;
  // Filled silhouette used as SVG clipPath — only geometry matters
  clipShape: () => React.ReactNode;
  outline: () => React.ReactNode;
};

const ANIMALS: Animal[] = [
  // ── Cat ────────────────────────────────────────────────────────────────────
  {
    id: 'cat', name: 'Cat', emoji: '🐱', bgColor: '#FFF8F0',
    clipShape: () => (
      <>
        <Path d="M150 160 Q182 140 176 118 Q170 103 158 114 Q153 130 150 162Z" fill="black" />
        <Ellipse cx={100} cy={145} rx={58} ry={48} fill="black" />
        <Circle cx={100} cy={88} r={50} fill="black" />
        <Path d="M57 62 L44 26 L84 54Z" fill="black" />
        <Path d="M143 62 L156 26 L116 54Z" fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M150 160 Q180 140 175 120 Q170 105 160 115 Q155 130 150 160Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={100} cy={145} rx={52} ry={42} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M78 130 Q82 145 78 160M90 127 Q94 145 90 163M110 127 Q114 145 110 163" fill="none" stroke="#555" strokeWidth={2} strokeLinecap="round" />
        <Circle cx={100} cy={88} r={42} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M65 60 L55 30 L82 52ZM135 60 L145 30 L118 52Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={100} cy={98} rx={20} ry={14} fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Ellipse cx={85} cy={80} rx={7} ry={8} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Ellipse cx={115} cy={80} rx={7} ry={8} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Circle cx={85} cy={80} r={3} fill="#111" /><Circle cx={115} cy={80} r={3} fill="#111" />
        <Circle cx={83} cy={78} r={1.5} fill="#fff" /><Circle cx={113} cy={78} r={1.5} fill="#fff" />
        <Path d="M97 96 L103 96 L100 100Z" fill="transparent" stroke="#c44" strokeWidth={1} />
        <Path d="M100 100 Q95 106 90 103M100 100 Q105 106 110 103" fill="none" stroke="#555" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M70 95 L90 97M70 100 L90 99M130 95 L110 97M130 100 L110 99" stroke="#aaa" strokeWidth={1} />
      </Svg>
    ),
  },

  // ── Dog ────────────────────────────────────────────────────────────────────
  {
    id: 'dog', name: 'Dog', emoji: '🐶', bgColor: '#F5F0FF',
    clipShape: () => (
      <>
        <Path d="M148 158 Q180 138 172 114 Q164 98 150 110 Q146 130 148 158Z" fill="black" />
        <Ellipse cx={98} cy={148} rx={58} ry={44} fill="black" />
        <Circle cx={98} cy={88} r={48} fill="black" />
        <Path d="M58 70 Q44 52 48 92 Q52 108 72 100 Q76 84 58 70Z" fill="black" />
        <Path d="M138 70 Q152 52 148 92 Q144 108 124 100 Q120 84 138 70Z" fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M148 155 Q178 138 170 115 Q164 100 152 112 Q148 130 148 155Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={98} cy={148} rx={54} ry={40} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Ellipse cx={105} cy={155} rx={16} ry={12} fill="transparent" stroke="#666" strokeWidth={1.5} />
        <Circle cx={98} cy={88} r={42} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M62 72 Q48 55 52 90 Q56 105 70 98 Q74 82 62 72Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M134 72 Q148 55 144 90 Q140 105 126 98 Q122 82 134 72Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={98} cy={100} rx={22} ry={16} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Circle cx={84} cy={80} r={8} fill="transparent" stroke="#222" strokeWidth={1.5} />
        <Circle cx={112} cy={80} r={8} fill="transparent" stroke="#222" strokeWidth={1.5} />
        <Circle cx={84} cy={80} r={4} fill="#111" /><Circle cx={112} cy={80} r={4} fill="#111" />
        <Circle cx={82} cy={77} r={2} fill="#fff" /><Circle cx={110} cy={77} r={2} fill="#fff" />
        <Ellipse cx={98} cy={96} rx={8} ry={6} fill="transparent" stroke="#555" strokeWidth={1} />
        <Path d="M98 102 Q92 108 86 105M98 102 Q104 108 110 105" fill="none" stroke="#555" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M72 118 Q98 124 124 118" fill="none" stroke="#E53935" strokeWidth={5} strokeLinecap="round" />
        <Circle cx={98} cy={121} r={4} fill="#FFD600" />
      </Svg>
    ),
  },

  // ── Elephant ───────────────────────────────────────────────────────────────
  {
    id: 'elephant', name: 'Elephant', emoji: '🐘', bgColor: '#F0FFF0',
    clipShape: () => (
      <>
        <Ellipse cx={58} cy={85} rx={32} ry={40} fill="black" />
        <Circle cx={110} cy={88} r={50} fill="black" />
        <Ellipse cx={108} cy={148} rx={64} ry={46} fill="black" />
        <Rect x={64} y={168} width={30} height={26} rx={8} fill="black" />
        <Rect x={102} y={168} width={30} height={26} rx={8} fill="black" />
        {/* Trunk approximated as wide rect */}
        <Rect x={70} y={116} width={36} height={56} rx={10} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Ellipse cx={58} cy={85} rx={26} ry={34} fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={108} cy={148} rx={58} ry={40} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Rect x={70} y={172} width={22} height={20} rx={8} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Rect x={108} y={172} width={22} height={20} rx={8} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Path d="M70 188 Q81 194 92 188M108 188 Q119 194 130 188" fill="none" stroke="#555" strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={110} cy={88} r={44} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M92 120 Q80 135 76 155 Q74 165 82 166 Q90 167 92 158 Q94 140 102 125" fill="none" stroke="#333" strokeWidth={16} strokeLinecap="round" />
        <Path d="M92 120 Q80 135 76 155 Q74 165 82 166 Q90 167 92 158 Q94 140 102 125" fill="none" stroke="#eee" strokeWidth={12} strokeLinecap="round" />
        <Path d="M92 120 Q80 135 76 155 Q74 165 82 166 Q90 167 92 158 Q94 140 102 125" fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" />
        <Path d="M95 116 Q82 126 78 138 Q76 146 84 146 Q90 140 94 128" fill="none" stroke="#333" strokeWidth={7} strokeLinecap="round" />
        <Circle cx={126} cy={76} r={9} fill="transparent" stroke="#222" strokeWidth={1.5} />
        <Circle cx={126} cy={76} r={4.5} fill="#111" />
        <Circle cx={124} cy={74} r={2} fill="#fff" />
        <Path d="M162 148 Q172 138 168 155 Q164 168 158 162" fill="none" stroke="#333" strokeWidth={4} strokeLinecap="round" />
      </Svg>
    ),
  },

  // ── Lion ───────────────────────────────────────────────────────────────────
  {
    id: 'lion', name: 'Lion', emoji: '🦁', bgColor: '#FFFDE7',
    clipShape: () => (
      <>
        <Path d="M152 160 Q187 140 180 116 Q172 100 158 112 Q154 132 152 160Z" fill="black" />
        <Ellipse cx={98} cy={150} rx={60} ry={44} fill="black" />
        <Circle cx={98} cy={88} r={58} fill="black" />
        <Circle cx={68} cy={52} r={18} fill="black" />
        <Circle cx={128} cy={52} r={18} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M152 158 Q185 140 178 118 Q172 102 160 112 Q156 130 152 158Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M170 112 Q180 105 176 118" fill="none" stroke="#333" strokeWidth={8} strokeLinecap="round" />
        <Ellipse cx={98} cy={150} rx={54} ry={38} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={98} cy={88} r={52} fill="transparent" stroke="#555" strokeWidth={2} />
        <Circle cx={68} cy={52} r={13} fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={128} cy={52} r={13} fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={98} cy={90} r={38} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Ellipse cx={98} cy={104} rx={20} ry={14} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Ellipse cx={84} cy={82} rx={8} ry={9} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Ellipse cx={112} cy={82} rx={8} ry={9} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Ellipse cx={84} cy={82} rx={4} ry={5} fill="#222" /><Ellipse cx={112} cy={82} rx={4} ry={5} fill="#222" />
        <Circle cx={82} cy={80} r={2} fill="#fff" /><Circle cx={110} cy={80} r={2} fill="#fff" />
        <Path d="M94 100 L102 100 L98 106Z" fill="transparent" stroke="#8B0000" strokeWidth={1} />
        <Path d="M98 106 Q92 112 86 109M98 106 Q104 112 110 109" fill="none" stroke="#555" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M68 102 L88 104M68 107 L88 106M128 102 L108 104M128 107 L108 106" stroke="#aaa" strokeWidth={1.2} />
      </Svg>
    ),
  },

  // ── Rabbit ─────────────────────────────────────────────────────────────────
  {
    id: 'rabbit', name: 'Rabbit', emoji: '🐰', bgColor: '#FFF0F5',
    clipShape: () => (
      <>
        <Ellipse cx={78} cy={42} rx={20} ry={42} fill="black" />
        <Ellipse cx={122} cy={42} rx={20} ry={42} fill="black" />
        <Circle cx={100} cy={90} r={44} fill="black" />
        <Ellipse cx={100} cy={150} rx={52} ry={46} fill="black" />
        <Circle cx={148} cy={162} r={14} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Ellipse cx={78} cy={42} rx={14} ry={36} fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={78} cy={44} rx={8} ry={28} fill="transparent" stroke="#ccc" strokeWidth={1} />
        <Ellipse cx={122} cy={42} rx={14} ry={36} fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={122} cy={44} rx={8} ry={28} fill="transparent" stroke="#ccc" strokeWidth={1} />
        <Ellipse cx={100} cy={150} rx={46} ry={40} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={146} cy={162} r={10} fill="transparent" stroke="#ccc" strokeWidth={1.5} />
        <Circle cx={100} cy={90} r={38} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={76} cy={100} r={10} fill="transparent" stroke="#ddd" strokeWidth={1} />
        <Circle cx={124} cy={100} r={10} fill="transparent" stroke="#ddd" strokeWidth={1} />
        <Ellipse cx={100} cy={102} rx={18} ry={12} fill="transparent" stroke="#ddd" strokeWidth={1} />
        <Circle cx={86} cy={82} r={7} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Circle cx={114} cy={82} r={7} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Circle cx={86} cy={82} r={3.5} fill="#111" /><Circle cx={114} cy={82} r={3.5} fill="#111" />
        <Circle cx={84} cy={80} r={1.5} fill="#fff" /><Circle cx={112} cy={80} r={1.5} fill="#fff" />
        <Circle cx={100} cy={100} r={4} fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Path d="M100 104 Q95 110 90 107M100 104 Q105 110 110 107" fill="none" stroke="#888" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M68 100 L86 101M68 104 L86 103M132 100 L114 101M132 104 L114 103" stroke="#ccc" strokeWidth={1} />
      </Svg>
    ),
  },

  // ── Butterfly ──────────────────────────────────────────────────────────────
  {
    id: 'butterfly', name: 'Butterfly', emoji: '🦋', bgColor: '#EEF0FF',
    clipShape: () => (
      <>
        <Path d="M100 90 Q66 48 38 56 Q16 68 28 102 Q40 122 80 114 Q98 108 100 90Z" fill="black" />
        <Path d="M100 90 Q134 48 162 56 Q184 68 172 102 Q160 122 120 114 Q102 108 100 90Z" fill="black" />
        <Path d="M100 104 Q70 108 52 130 Q40 154 58 166 Q78 175 96 152 Q102 132 100 104Z" fill="black" />
        <Path d="M100 104 Q130 108 148 130 Q160 154 142 166 Q122 175 104 152 Q98 132 100 104Z" fill="black" />
        <Ellipse cx={100} cy={104} rx={8} ry={32} fill="black" />
        <Circle cx={100} cy={74} r={12} fill="black" />
        <Path d="M97 68 Q86 48 76 42M103 68 Q114 48 124 42" fill="none" stroke="black" strokeWidth={10} strokeLinecap="round" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M100 95 Q68 55 42 62 Q22 72 32 100 Q42 118 78 110 Q96 105 100 95Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M100 95 Q132 55 158 62 Q178 72 168 100 Q158 118 122 110 Q104 105 100 95Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M100 108 Q72 112 55 132 Q44 152 60 162 Q78 170 94 148 Q100 130 100 108Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M100 108 Q128 112 145 132 Q156 152 140 162 Q122 170 106 148 Q100 130 100 108Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M100 95 Q78 82 58 76M100 95 Q122 82 142 76" fill="none" stroke="#555" strokeWidth={1.5} />
        <Circle cx={60} cy={82} r={8} fill="transparent" stroke="#555" strokeWidth={1} />
        <Circle cx={142} cy={82} r={8} fill="transparent" stroke="#555" strokeWidth={1} />
        <Circle cx={76} cy={100} r={5} fill="transparent" stroke="#555" strokeWidth={1} />
        <Circle cx={124} cy={100} r={5} fill="transparent" stroke="#555" strokeWidth={1} />
        <Circle cx={68} cy={144} r={7} fill="transparent" stroke="#555" strokeWidth={1} />
        <Circle cx={132} cy={144} r={7} fill="transparent" stroke="#555" strokeWidth={1} />
        <Ellipse cx={100} cy={104} rx={6} ry={28} fill="transparent" stroke="#222" strokeWidth={1.5} />
        <Circle cx={100} cy={74} r={8} fill="transparent" stroke="#222" strokeWidth={1.5} />
        <Path d="M97 68 Q88 52 80 46M103 68 Q112 52 120 46" fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" />
        <Circle cx={80} cy={46} r={4} fill="#333" /><Circle cx={120} cy={46} r={4} fill="#333" />
      </Svg>
    ),
  },

  // ── Fish ───────────────────────────────────────────────────────────────────
  {
    id: 'fish', name: 'Fish', emoji: '🐠', bgColor: '#E0FBFF',
    clipShape: () => (
      <>
        <Path d="M150 100 L182 68 L182 132 Z" fill="black" />
        <Ellipse cx={98} cy={100} rx={62} ry={42} fill="black" />
        <Path d="M78 58 Q100 38 122 58 L118 68 Q100 50 82 68Z" fill="black" />
        <Path d="M86 132 Q100 156 114 132 L110 128 Q100 148 90 128Z" fill="black" />
        <Path d="M72 100 Q58 84 50 94 Q54 112 72 108Z" fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M152 100 L180 72 L180 128 Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={98} cy={100} rx={58} ry={38} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M60 88 Q72 80 84 88M74 96 Q86 88 98 96M60 104 Q72 96 84 104M74 112 Q86 104 98 112M88 88 Q100 80 112 88M102 96 Q114 88 126 96" fill="none" stroke="#555" strokeWidth={1.5} />
        <Path d="M78 64 Q82 100 78 136M100 62 Q104 100 100 138" fill="none" stroke="#888" strokeWidth={5} strokeLinecap="round" />
        <Path d="M80 64 Q100 42 120 64" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M88 136 Q100 154 112 136" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M72 100 Q60 86 52 96 Q56 110 72 106Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={60} cy={90} r={12} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Circle cx={60} cy={90} r={7} fill="transparent" stroke="#222" strokeWidth={1} />
        <Circle cx={60} cy={90} r={3} fill="#111" />
        <Circle cx={57} cy={87} r={2} fill="#fff" />
        <Path d="M40 100 Q44 106 40 112" fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" />
        <Circle cx={36} cy={82} r={4} fill="transparent" stroke="#81D4FA" strokeWidth={1.5} />
        <Circle cx={30} cy={72} r={3} fill="transparent" stroke="#81D4FA" strokeWidth={1.5} />
      </Svg>
    ),
  },

  // ── Owl ────────────────────────────────────────────────────────────────────
  {
    id: 'owl', name: 'Owl', emoji: '🦉', bgColor: '#F3EEFF',
    clipShape: () => (
      <>
        <Path d="M100 106 Q60 96 44 128 Q40 154 66 162 Q88 166 100 150Z" fill="black" />
        <Path d="M100 106 Q140 96 156 128 Q160 154 134 162 Q112 166 100 150Z" fill="black" />
        <Ellipse cx={100} cy={140} rx={44} ry={38} fill="black" />
        <Circle cx={100} cy={90} r={44} fill="black" />
        <Path d="M74 56 L64 32 L88 50Z" fill="black" />
        <Path d="M126 56 L136 32 L112 50Z" fill="black" />
        <Path d="M84 170 L78 188 M84 170 L84 188 M84 170 L90 188" stroke="black" strokeWidth={6} strokeLinecap="round" />
        <Path d="M116 170 L110 188 M116 170 L116 188 M116 170 L122 188" stroke="black" strokeWidth={6} strokeLinecap="round" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M100 110 Q62 100 48 130 Q44 152 68 158 Q88 160 100 148Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M100 110 Q138 100 152 130 Q156 152 132 158 Q112 160 100 148Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M66 118 Q78 122 70 134M56 130 Q68 134 60 146M134 118 Q122 122 130 134M144 130 Q132 134 140 146" fill="none" stroke="#555" strokeWidth={1.5} />
        <Ellipse cx={100} cy={140} rx={38} ry={32} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Ellipse cx={100} cy={144} rx={22} ry={22} fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Path d="M88 132 Q100 128 112 132M84 140 Q100 136 116 140M86 148 Q100 144 114 148" fill="none" stroke="#555" strokeWidth={1.5} />
        <Circle cx={100} cy={90} r={38} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M78 58 L70 36 L86 52ZM122 58 L130 36 L114 52Z" fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Ellipse cx={100} cy={92} rx={28} ry={26} fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Circle cx={86} cy={84} r={12} fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={114} cy={84} r={12} fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={86} cy={84} r={6} fill="#111" /><Circle cx={114} cy={84} r={6} fill="#111" />
        <Circle cx={84} cy={82} r={2.5} fill="#fff" /><Circle cx={112} cy={82} r={2.5} fill="#fff" />
        <Path d="M96 94 L104 94 L100 104Z" fill="transparent" stroke="#E65100" strokeWidth={1} />
        <Path d="M84 170 L78 182M84 170 L84 182M84 170 L90 182M116 170 L110 182M116 170 L116 182M116 170 L122 182" stroke="#555" strokeWidth={3} strokeLinecap="round" />
        <Path d="M62 172 L138 172" stroke="#6D4C41" strokeWidth={8} strokeLinecap="round" />
      </Svg>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ColoringPage() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedColor, setSelectedColor] = useState('#E53935');
  const [brushSize, setBrushSize] = useState(7);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);

  const canvasWRef = useRef(200);
  const canvasHRef = useRef(200);
  const currentPts = useRef<{ x: number; y: number }[]>([]);
  const colorRef = useRef(selectedColor);
  const brushRef = useRef(brushSize);
  useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const sc = Math.min(canvasWRef.current, canvasHRef.current) / 200;
        const ox = (canvasWRef.current - 200 * sc) / 2;
        const oy = (canvasHRef.current - 200 * sc) / 2;
        const x = (e.nativeEvent.locationX - ox) / sc;
        const y = (e.nativeEvent.locationY - oy) / sc;
        currentPts.current = [{ x, y }];
        setLiveStroke({ d: buildPath(currentPts.current), color: colorRef.current, width: brushRef.current });
      },
      onPanResponderMove: (e) => {
        const sc = Math.min(canvasWRef.current, canvasHRef.current) / 200;
        const ox = (canvasWRef.current - 200 * sc) / 2;
        const oy = (canvasHRef.current - 200 * sc) / 2;
        const x = (e.nativeEvent.locationX - ox) / sc;
        const y = (e.nativeEvent.locationY - oy) / sc;
        currentPts.current = [...currentPts.current, { x, y }];
        setLiveStroke({ d: buildPath(currentPts.current), color: colorRef.current, width: brushRef.current });
      },
      onPanResponderRelease: () => {
        if (currentPts.current.length > 0) {
          setStrokes(prev => [...prev, { d: buildPath(currentPts.current), color: colorRef.current, width: brushRef.current }]);
        }
        currentPts.current = [];
        setLiveStroke(null);
      },
    })
  ).current;

  const { width } = dims;
  const scale = getScale(width);

  const pickAnimal = (a: Animal) => { setSelectedAnimal(a); setStrokes([]); setLiveStroke(null); };
  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => setStrokes([]);

  return (
    <View style={st.screen}>
      <View style={st.header}>
        <TouchableOpacity style={st.navBtn}
          onPress={selectedAnimal ? () => setSelectedAnimal(null) : () => router.replace('/drawing')}
          activeOpacity={0.85}>
          <Text style={{ fontSize: 12 * scale, color: '#fff', fontWeight: '800' }}>
            {selectedAnimal ? '← Animals' : '🏠'}
          </Text>
        </TouchableOpacity>
        <View style={st.hdrCenter}>
          <Text style={[st.hdrTitle, { fontSize: 16 * scale }]}>
            {selectedAnimal ? `🎨 Colour the ${selectedAnimal.name}!` : '🎨 Animal Colouring'}
          </Text>
          <Text style={[st.hdrSub, { fontSize: 9 * scale }]}>
            {selectedAnimal ? 'Pick a colour & brush — draw freely!' : 'Pick an animal to colour!'}
          </Text>
        </View>
        {selectedAnimal ? (
          <View style={st.actionBtns}>
            <TouchableOpacity style={[st.navBtn, { backgroundColor: '#37474F' }]} onPress={undo} activeOpacity={0.85}>
              <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>↩ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.navBtn, { backgroundColor: '#E53935' }]} onPress={clear} activeOpacity={0.85}>
              <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>🗑 Clear</Text>
            </TouchableOpacity>
          </View>
        ) : <View style={st.navBtn} />}
      </View>

      {!selectedAnimal ? (
        <ScrollView contentContainerStyle={st.grid} showsVerticalScrollIndicator={false}>
          {ANIMALS.map(a => (
            <TouchableOpacity key={a.id}
              style={[st.card, { backgroundColor: a.bgColor }]}
              onPress={() => pickAnimal(a)} activeOpacity={0.85}
            >
              <View style={st.thumb}>{a.outline()}</View>
              <Text style={[st.cardName, { fontSize: 13 * scale }]}>{a.name}</Text>
              <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={st.drawingArea}>
          <View style={st.sidebar}>
            <Text style={[st.sideLabel, { fontSize: 10 * scale }]}>🎨 Colour</Text>
            <View style={st.palette}>
              {PALETTE.map(c => (
                <TouchableOpacity key={c}
                  style={[st.swatch, {
                    backgroundColor: c,
                    borderColor: selectedColor === c ? '#FFD700' : 'rgba(255,255,255,0.3)',
                    borderWidth: selectedColor === c ? 4 : 1.5,
                    transform: [{ scale: selectedColor === c ? 1.2 : 1 }],
                  }]}
                  onPress={() => setSelectedColor(c)} activeOpacity={0.8}
                />
              ))}
            </View>
            <Text style={[st.sideLabel, { fontSize: 10 * scale, marginTop: 14 }]}>🖌 Brush</Text>
            <View style={st.brushRow}>
              {BRUSHES.map(b => (
                <TouchableOpacity key={b}
                  style={[st.brushBtn, brushSize === b && { borderColor: '#FFD700', borderWidth: 2.5 }]}
                  onPress={() => setBrushSize(b)} activeOpacity={0.8}
                >
                  <View style={{ width: Math.max(4, b * 1.4), height: Math.max(4, b * 1.4), borderRadius: 99, backgroundColor: selectedColor }} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.currentColor}>
              <View style={[st.currentDot, { backgroundColor: selectedColor }]} />
              <Text style={[st.currentTxt, { fontSize: 9 * scale }]}>Selected</Text>
            </View>
            <Text style={[st.tip, { fontSize: 8 * scale }]}>💡 Colour stays inside the animal!</Text>
          </View>

          <View style={[st.canvas, { backgroundColor: selectedAnimal.bgColor }]}
            onLayout={e => {
              canvasWRef.current = e.nativeEvent.layout.width;
              canvasHRef.current = e.nativeEvent.layout.height;
            }}
          >
            {/* Strokes clipped to the animal silhouette */}
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 200" pointerEvents="none">
              <Defs>
                <ClipPath id="animalClip">
                  {selectedAnimal.clipShape()}
                </ClipPath>
              </Defs>
              <G clipPath="url(#animalClip)">
                {strokes.map((s, i) => (
                  <Path key={i} d={s.d} stroke={s.color} strokeWidth={s.width}
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {liveStroke && (
                  <Path d={liveStroke.d} stroke={liveStroke.color} strokeWidth={liveStroke.width}
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </G>
            </Svg>
            {/* Outline always on top */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {selectedAnimal.outline()}
            </View>
            {/* Touch capture */}
            <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A1A2E', padding: 10, gap: 8 },
  header: {
    height: 52, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 14, gap: 10, backgroundColor: '#AD1457',
  },
  navBtn: {
    minWidth: 72, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10,
  },
  actionBtns: { flexDirection: 'row', gap: 6 },
  hdrCenter: { flex: 1, alignItems: 'center' },
  hdrTitle: { fontWeight: '900', color: '#FFD700', letterSpacing: 0.3 },
  hdrSub: { color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: 6 },
  card: {
    width: 130, borderRadius: 20, borderWidth: 2.5, borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  thumb: { width: 90, height: 90 },
  cardName: { fontWeight: '900', color: '#333' },
  drawingArea: { flex: 1, flexDirection: 'row', gap: 10 },
  sidebar: { width: 148, backgroundColor: '#16213E', borderRadius: 18, padding: 12, gap: 6 },
  sideLabel: { color: '#FFD700', fontWeight: '900', letterSpacing: 0.3 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    width: 28, height: 28, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  brushRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  brushBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  currentColor: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  currentDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  currentTxt: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  tip: { color: 'rgba(255,255,255,0.35)', fontWeight: '600', lineHeight: 14, marginTop: 'auto' },
  canvas: { flex: 1, borderRadius: 22, overflow: 'hidden' },
});
