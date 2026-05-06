import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, TouchableOpacity, Text, Dimensions, ScrollView, PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Ellipse, Rect, Line, Defs, ClipPath, G } from 'react-native-svg';

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
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

type Stroke = { d: string; color: string; width: number };

type Vehicle = {
  id: string; name: string; emoji: string; bgColor: string;
  clipShape: () => React.ReactNode;
  outline: () => React.ReactNode;
};

const VEHICLES: Vehicle[] = [
  // ── Car ──────────────────────────────────────────────────────────────────────
  {
    id: 'car', name: 'Car', emoji: '🚗', bgColor: '#F0F8FF',
    clipShape: () => (
      <>
        <Path d="M18 105 L18 148 Q18 152 30 152 L170 152 Q182 152 182 148 L182 105Z" fill="black" />
        <Path d="M55 105 Q65 68 100 62 Q135 68 145 105Z" fill="black" />
        <Circle cx={52} cy={150} r={18} fill="black" />
        <Circle cx={148} cy={150} r={18} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M18 118 Q18 145 30 148 L170 148 Q182 145 182 118 L182 105 L18 105Z"
          fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M55 105 Q65 68 100 62 Q135 68 145 105Z"
          fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M68 104 Q74 76 100 70 Q126 76 132 104Z"
          fill="transparent" stroke="#666" strokeWidth={1.5} />
        <Rect x={88} y={108} width={36} height={28} rx={4} fill="transparent" stroke="#666" strokeWidth={1.5} />
        <Rect x={116} y={119} width={8} height={4} rx={2} fill="#aaa" />
        <Rect x={14} y={140} width={28} height={10} rx={4} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Rect x={158} y={140} width={28} height={10} rx={4} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Ellipse cx={26} cy={116} rx={9} ry={7} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Ellipse cx={174} cy={116} rx={9} ry={7} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Circle cx={52} cy={150} r={18} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={52} cy={150} r={9} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={52} cy={150} r={3} fill="#888" />
        <Circle cx={148} cy={150} r={18} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={148} cy={150} r={9} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={148} cy={150} r={3} fill="#888" />
      </Svg>
    ),
  },
  // ── Bus ──────────────────────────────────────────────────────────────────────
  {
    id: 'bus', name: 'Bus', emoji: '🚌', bgColor: '#FFFEF0',
    clipShape: () => (
      <>
        <Rect x={16} y={62} width={168} height={88} rx={8} fill="black" />
        <Circle cx={52} cy={154} r={17} fill="black" />
        <Circle cx={148} cy={154} r={17} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Rect x={16} y={78} width={168} height={72} rx={8} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Rect x={16} y={62} width={168} height={20} rx={8} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Rect x={16} y={78} width={28} height={72} rx={4} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Ellipse cx={26} cy={92} rx={8} ry={6} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Ellipse cx={26} cy={138} rx={8} ry={5} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        {[56, 88, 120, 152].map(x => (
          <Rect key={x} x={x} y={85} width={24} height={22} rx={4} fill="transparent" stroke="#666" strokeWidth={1.5} />
        ))}
        <Rect x={155} y={100} width={24} height={46} rx={4} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Line x1={167} y1={104} x2={167} y2={142} stroke="#888" strokeWidth={1.5} />
        <Circle cx={52} cy={154} r={17} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={52} cy={154} r={8} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={148} cy={154} r={17} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={148} cy={154} r={8} fill="transparent" stroke="#555" strokeWidth={1.5} />
      </Svg>
    ),
  },
  // ── Airplane ─────────────────────────────────────────────────────────────────
  {
    id: 'airplane', name: 'Airplane', emoji: '✈️', bgColor: '#EEF2FF',
    clipShape: () => (
      <>
        <Ellipse cx={100} cy={100} rx={72} ry={20} fill="black" />
        <Path d="M50 104 Q70 72 98 96 Q70 110 50 104Z" fill="black" />
        <Path d="M150 104 Q130 72 102 96 Q130 110 150 104Z" fill="black" />
        <Path d="M30 100 Q28 72 40 66 Q48 72 46 100Z" fill="black" />
        <Path d="M20 100 Q36 88 52 96 Q36 104 20 100Z" fill="black" />
        <Ellipse cx={100} cy={114} rx={28} ry={7} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M50 104 Q70 72 98 96 Q70 110 50 104Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M150 104 Q130 72 102 96 Q130 110 150 104Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={100} cy={100} rx={72} ry={20} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M172 100 Q185 94 190 100 Q185 106 172 100Z" fill="transparent" stroke="#555" strokeWidth={2} />
        <Path d="M152 94 Q162 88 172 94 Q162 100 152 94Z" fill="transparent" stroke="#666" strokeWidth={1.5} />
        {[110, 125, 140].map(x => (
          <Ellipse key={x} cx={x} cy={96} rx={5} ry={6} fill="transparent" stroke="#666" strokeWidth={1.5} />
        ))}
        <Path d="M30 100 Q28 72 40 66 Q48 72 46 100Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M20 100 Q36 88 52 96 Q36 104 20 100Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={90} cy={114} rx={14} ry={7} fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={110} cy={114} rx={14} ry={7} fill="transparent" stroke="#333" strokeWidth={2} />
      </Svg>
    ),
  },
  // ── Train ────────────────────────────────────────────────────────────────────
  {
    id: 'train', name: 'Train', emoji: '🚂', bgColor: '#FFF0F0',
    clipShape: () => (
      <>
        <Ellipse cx={62} cy={96} rx={30} ry={18} fill="black" />
        <Rect x={22} y={96} width={80} height={50} rx={8} fill="black" />
        <Rect x={102} y={82} width={76} height={64} rx={6} fill="black" />
        <Rect x={46} y={56} width={14} height={40} rx={3} fill="black" />
        <Circle cx={38} cy={155} r={14} fill="black" />
        <Circle cx={72} cy={155} r={14} fill="black" />
        <Circle cx={118} cy={155} r={12} fill="black" />
        <Circle cx={162} cy={155} r={12} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Circle cx={52} cy={46} r={10} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Circle cx={44} cy={34} r={8} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Circle cx={55} cy={24} r={6} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Rect x={46} y={56} width={14} height={20} rx={3} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={22} y={96} width={80} height={50} rx={8} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Ellipse cx={62} cy={96} rx={30} ry={18} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Ellipse cx={22} cy={124} rx={6} ry={20} fill="transparent" stroke="#555" strokeWidth={2} />
        <Circle cx={20} cy={118} r={6} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Rect x={102} y={82} width={76} height={64} rx={6} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Rect x={102} y={78} width={76} height={10} rx={4} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={112} y={92} width={22} height={20} rx={4} fill="transparent" stroke="#666" strokeWidth={1.5} />
        <Rect x={144} y={92} width={22} height={20} rx={4} fill="transparent" stroke="#666" strokeWidth={1.5} />
        <Line x1={10} y1={162} x2={190} y2={162} stroke="#888" strokeWidth={3} />
        <Circle cx={38} cy={155} r={14} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={38} cy={155} r={6} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={72} cy={155} r={14} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={72} cy={155} r={6} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={118} cy={155} r={12} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={118} cy={155} r={5} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={162} cy={155} r={12} fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Circle cx={162} cy={155} r={5} fill="transparent" stroke="#555" strokeWidth={1.5} />
      </Svg>
    ),
  },
  // ── Rocket ───────────────────────────────────────────────────────────────────
  {
    id: 'rocket', name: 'Rocket', emoji: '🚀', bgColor: '#0D0D20',
    clipShape: () => (
      <>
        <Path d="M80 60 Q80 160 100 160 Q120 160 120 60Z" fill="black" />
        <Path d="M80 60 Q80 38 100 22 Q120 38 120 60Z" fill="black" />
        <Path d="M82 140 L62 165 L82 158Z" fill="black" />
        <Path d="M118 140 L138 165 L118 158Z" fill="black" />
        <Rect x={86} y={158} width={28} height={14} rx={4} fill="black" />
        <Path d="M84 168 Q90 185 100 190 Q110 185 116 168Z" fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M84 168 Q90 185 100 190 Q110 185 116 168Z" fill="transparent" stroke="#E65100" strokeWidth={1.5} />
        <Path d="M82 140 L62 165 L82 158Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M118 140 L138 165 L118 158Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={86} y={158} width={28} height={14} rx={4} fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M80 60 Q80 160 100 160 Q120 160 120 60Z" fill="transparent" stroke="#ccc" strokeWidth={2.5} />
        <Path d="M80 80 Q100 76 120 80 L120 92 Q100 88 80 92Z" fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Path d="M80 124 Q100 120 120 124 L120 136 Q100 132 80 136Z" fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Path d="M80 60 Q80 38 100 22 Q120 38 120 60Z" fill="transparent" stroke="#ccc" strokeWidth={2.5} />
        <Circle cx={100} cy={106} r={16} fill="transparent" stroke="#aaa" strokeWidth={2} />
        <Circle cx={100} cy={106} r={10} fill="transparent" stroke="#666" strokeWidth={1} />
        <Circle cx={50} cy={40} r={2} fill="#FFD700" />
        <Circle cx={155} cy={60} r={2} fill="#FFD700" />
        <Circle cx={40} cy={90} r={1.5} fill="#FFD700" />
        <Circle cx={162} cy={30} r={1.5} fill="#FFD700" />
        <Circle cx={165} cy={100} r={2} fill="#FFD700" />
      </Svg>
    ),
  },
  // ── Helicopter ───────────────────────────────────────────────────────────────
  {
    id: 'helicopter', name: 'Helicopter', emoji: '🚁', bgColor: '#F0FFF4',
    clipShape: () => (
      <>
        <Path d="M42 84 Q42 140 100 144 Q158 140 158 118 L158 100 Q148 84 100 82Z" fill="black" />
        <Path d="M148 106 Q165 104 175 98 Q175 114 165 116 Q155 118 148 118Z" fill="black" />
        <Rect x={18} y={66} width={74} height={8} rx={4} fill="black" />
        <Rect x={108} y={66} width={74} height={8} rx={4} fill="black" />
        <Rect x={42} y={156} width={50} height={7} rx={3} fill="black" />
        <Rect x={96} y={156} width={50} height={7} rx={3} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Rect x={18} y={66} width={74} height={8} rx={4} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={108} y={66} width={74} height={8} rx={4} fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={100} cy={70} r={8} fill="#888" stroke="#333" strokeWidth={2} />
        <Rect x={97} y={70} width={6} height={14} fill="#666" />
        <Path d="M148 106 Q165 104 175 98 Q175 114 165 116 Q155 118 148 118Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={172} y={84} width={6} height={32} rx={3} fill="transparent" stroke="#333" strokeWidth={1.5} />
        <Path d="M42 84 Q42 140 100 144 Q158 140 158 118 L158 100 Q148 84 100 82 Z" fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Ellipse cx={56} cy={104} rx={18} ry={22} fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={56} cy={100} rx={12} ry={14} fill="transparent" stroke="#88BBFF" strokeWidth={1.5} />
        <Ellipse cx={90} cy={94} rx={10} ry={12} fill="transparent" stroke="#88BBFF" strokeWidth={1.5} />
        <Line x1={65} y1={140} x2={65} y2={158} stroke="#666" strokeWidth={3} strokeLinecap="round" />
        <Line x1={110} y1={140} x2={110} y2={158} stroke="#666" strokeWidth={3} strokeLinecap="round" />
        <Rect x={42} y={156} width={50} height={7} rx={3.5} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={96} y={156} width={50} height={7} rx={3.5} fill="transparent" stroke="#333" strokeWidth={2} />
      </Svg>
    ),
  },
  // ── Ship ─────────────────────────────────────────────────────────────────────
  {
    id: 'ship', name: 'Ship', emoji: '🚢', bgColor: '#E8FAFB',
    clipShape: () => (
      <>
        <Path d="M22 120 Q22 162 40 162 L160 162 Q178 162 178 120Z" fill="black" />
        <Rect x={18} y={106} width={164} height={16} rx={4} fill="black" />
        <Rect x={50} y={74} width={100} height={34} rx={5} fill="black" />
        <Rect x={68} y={52} width={64} height={24} rx={5} fill="black" />
        <Rect x={90} y={30} width={20} height={24} rx={5} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Path d="M10 155 Q30 148 50 155 Q70 162 90 155 Q110 148 130 155 Q150 162 170 155 Q185 150 190 155 L190 175 Q170 168 150 175 Q130 182 110 175 Q90 168 70 175 Q50 182 30 175 Q15 170 10 175Z" fill="transparent" stroke="#0288D1" strokeWidth={1.5} />
        <Path d="M22 120 Q22 158 40 162 L160 162 Q178 158 178 120Z" fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Rect x={18} y={106} width={164} height={16} rx={4} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={50} y={74} width={100} height={34} rx={5} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={68} y={52} width={64} height={24} rx={5} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={90} y={30} width={20} height={24} rx={5} fill="transparent" stroke="#333" strokeWidth={2} />
        <Rect x={90} y={44} width={20} height={6} rx={2} fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Circle cx={98} cy={22} r={8} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Circle cx={105} cy={14} r={6} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Circle cx={100} cy={8} r={4} fill="transparent" stroke="#aaa" strokeWidth={1} />
        {[50, 80, 110, 140].map(x => (
          <Circle key={x} cx={x} cy={138} r={7} fill="transparent" stroke="#555" strokeWidth={1.5} />
        ))}
        {[62, 84, 106, 126].map((x, i) => (
          <Rect key={i} x={x} y={80} width={16} height={12} rx={3} fill="transparent" stroke="#666" strokeWidth={1.5} />
        ))}
      </Svg>
    ),
  },
  // ── Race Car ─────────────────────────────────────────────────────────────────
  {
    id: 'racecar', name: 'Race Car', emoji: '🏎️', bgColor: '#FFF0F0',
    clipShape: () => (
      <>
        <Path d="M52 110 Q52 134 70 134 L155 134 Q172 128 178 116 Q168 104 148 102 L80 102 Q60 102 52 110Z" fill="black" />
        <Path d="M148 108 Q168 104 188 110 Q185 120 168 122 Q155 122 148 118Z" fill="black" />
        <Ellipse cx={96} cy={104} rx={22} ry={12} fill="black" />
        <Rect x={18} y={94} width={36} height={8} rx={4} fill="black" />
        <Circle cx={76} cy={138} r={16} fill="black" />
        <Circle cx={148} cy={138} r={16} fill="black" />
      </>
    ),
    outline: () => (
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Rect x={28} y={98} width={6} height={20} rx={2} fill="#666" />
        <Rect x={40} y={98} width={6} height={20} rx={2} fill="#666" />
        <Rect x={18} y={94} width={36} height={8} rx={4} fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M52 110 Q52 130 70 134 L155 134 Q172 128 178 116 Q168 104 148 102 L80 102 Q60 102 52 110Z" fill="transparent" stroke="#333" strokeWidth={2.5} />
        <Path d="M148 108 Q168 104 188 110 Q185 120 168 122 Q155 122 148 118Z" fill="transparent" stroke="#333" strokeWidth={2} />
        <Path d="M70 110 L148 110 L148 116 L70 116ZM70 122 L148 122 L148 128 L70 128Z" fill="transparent" stroke="#aaa" strokeWidth={1} />
        <Rect x={104} y={108} width={28} height={20} rx={3} fill="transparent" stroke="#aaa" strokeWidth={1.5} />
        <Ellipse cx={96} cy={104} rx={22} ry={12} fill="transparent" stroke="#333" strokeWidth={2} />
        <Circle cx={96} cy={98} r={12} fill="transparent" stroke="#333" strokeWidth={2} />
        <Ellipse cx={96} cy={102} rx={8} ry={4} fill="transparent" stroke="#88BBFF" strokeWidth={1} />
        <Circle cx={76} cy={138} r={16} fill="transparent" stroke="#222" strokeWidth={2.5} />
        <Circle cx={76} cy={138} r={8} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={76} cy={138} r={3} fill="#888" />
        <Circle cx={148} cy={138} r={16} fill="transparent" stroke="#222" strokeWidth={2.5} />
        <Circle cx={148} cy={138} r={8} fill="transparent" stroke="#555" strokeWidth={1.5} />
        <Circle cx={148} cy={138} r={3} fill="#888" />
        <Rect x={52} y={118} width={14} height={5} rx={2.5} fill="#888" stroke="#555" strokeWidth={1} />
        <Rect x={52} y={126} width={14} height={5} rx={2.5} fill="#888" stroke="#555" strokeWidth={1} />
      </Svg>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ColoringVehiclesPage() {
  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
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

  const pickVehicle = (v: Vehicle) => { setSelectedVehicle(v); setStrokes([]); setLiveStroke(null); };
  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => setStrokes([]);

  return (
    <View style={st.screen}>

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.navBtn}
          onPress={selectedVehicle ? () => setSelectedVehicle(null) : () => router.replace('/drawing')}
          activeOpacity={0.85}>
          <Text style={{ fontSize: 12 * scale, color: '#fff', fontWeight: '800' }}>
            {selectedVehicle ? '← Vehicles' : '🏠'}
          </Text>
        </TouchableOpacity>
        <View style={st.hdrCenter}>
          <Text style={[st.hdrTitle, { fontSize: 16 * scale }]}>
            {selectedVehicle ? `🎨 Colour the ${selectedVehicle.name}!` : '🚗 Vehicle Colouring'}
          </Text>
          <Text style={[st.hdrSub, { fontSize: 9 * scale }]}>
            {selectedVehicle ? 'Pick a colour & brush — draw freely!' : 'Pick a vehicle to colour!'}
          </Text>
        </View>
        {selectedVehicle ? (
          <View style={st.actionBtns}>
            <TouchableOpacity style={[st.navBtn, { backgroundColor: '#37474F' }]} onPress={undo} activeOpacity={0.85}>
              <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>↩ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.navBtn, { backgroundColor: '#E53935' }]} onPress={clear} activeOpacity={0.85}>
              <Text style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '800' }}>🗑 Clear</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={st.navBtn} />
        )}
      </View>

      {/* Picker grid */}
      {!selectedVehicle ? (
        <ScrollView contentContainerStyle={st.grid} showsVerticalScrollIndicator={false}>
          {VEHICLES.map(v => (
            <TouchableOpacity key={v.id}
              style={[st.card, { backgroundColor: v.bgColor }]}
              onPress={() => pickVehicle(v)} activeOpacity={0.85}
            >
              <View style={st.thumb}>{v.outline()}</View>
              <Text style={[st.cardName, { fontSize: 13 * scale }]}>{v.name}</Text>
              <Text style={{ fontSize: 22 }}>{v.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={st.drawingArea}>

          {/* Sidebar */}
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
                  <View style={{
                    width: Math.max(4, b * 1.4), height: Math.max(4, b * 1.4),
                    borderRadius: 99, backgroundColor: selectedColor,
                  }} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={st.currentColor}>
              <View style={[st.currentDot, { backgroundColor: selectedColor }]} />
              <Text style={[st.currentTxt, { fontSize: 9 * scale }]}>Selected</Text>
            </View>

            <Text style={[st.tip, { fontSize: 8 * scale }]}>
              💡 Draw anywhere on the vehicle!
            </Text>
          </View>

          {/* Canvas */}
          <View style={[st.canvas, { backgroundColor: selectedVehicle.bgColor }]}
            onLayout={e => {
              canvasWRef.current = e.nativeEvent.layout.width;
              canvasHRef.current = e.nativeEvent.layout.height;
            }}
          >
            {/* Strokes clipped to vehicle silhouette */}
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 200" pointerEvents="none">
              <Defs>
                <ClipPath id="vehicleClip">
                  {selectedVehicle.clipShape()}
                </ClipPath>
              </Defs>
              <G clipPath="url(#vehicleClip)">
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

            {/* Outline on top */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {selectedVehicle.outline()}
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
    alignItems: 'center', paddingHorizontal: 14, gap: 10,
    backgroundColor: '#0277BD',
  },
  navBtn: {
    minWidth: 72, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 10,
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
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  currentColor: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  currentDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  currentTxt: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  tip: { color: 'rgba(255,255,255,0.35)', fontWeight: '600', lineHeight: 14, marginTop: 'auto' },
  canvas: { flex: 1, borderRadius: 22, overflow: 'hidden' },
});
