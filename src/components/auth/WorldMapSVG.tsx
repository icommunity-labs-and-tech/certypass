'use client';

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

// Flat city map palette
const BLOCK = '#e3e3e3';   // city block fill
const PARK  = '#b4d49e';   // parks & green areas
const BLDG  = '#cecece';   // building footprints (slightly darker)
const W     = '#ffffff';   // streets

// Bubble geometry
const BW = 88, BH = 22, TH = 8, R = 5;

function bubblePath(cx: number, ty: number): string {
  const l = cx - BW / 2, r = cx + BW / 2, b = ty + BH;
  return [
    `M ${l+R},${ty}`, `L ${r-R},${ty}`,
    `Q ${r},${ty} ${r},${ty+R}`, `L ${r},${b-R}`,
    `Q ${r},${b} ${r-R},${b}`, `L ${cx+4},${b}`,
    `L ${cx},${b+TH}`, `L ${cx-4},${b}`, `L ${l+R},${b}`,
    `Q ${l},${b} ${l},${b-R}`, `L ${l},${ty+R}`,
    `Q ${l},${ty} ${l+R},${ty}`, 'Z',
  ].join(' ');
}

const EVENTS = [
  { cx: 140,  cy:  28, label: 'Verificado',  dot: '#0d6efd', begin: '0s'   },
  { cx: 500,  cy: 108, label: 'En tránsito', dot: '#0dcaf0', begin: '0.9s' },
  { cx: 112,  cy: 255, label: 'Inspección',  dot: '#ffc107', begin: '1.8s' },
  { cx: 700,  cy: 175, label: 'Entregado',   dot: '#198754', begin: '2.7s' },
  { cx: 750,  cy: 330, label: 'Registrado',  dot: '#6c757d', begin: '3.6s' },
] as const;

interface BubbleProps { cx: number; cy: number; label: string; dot: string; begin: string; }

function Bubble({ cx, cy, label, dot, begin }: BubbleProps) {
  const dur = '4.5s', kts = '0;0.12;0.78;1';
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes={kts} dur={dur} begin={begin} repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values="0,7;0,0;0,0;0,-3" keyTimes={kts} dur={dur} begin={begin} repeatCount="indefinite" />
      <path d={bubblePath(cx, cy)} fill="rgba(255,255,255,0.97)" stroke={dot} strokeWidth="1.5" filter="url(#bshadow)" />
      <circle cx={cx - BW/2 + 12} cy={cy + BH/2} r="4" fill={dot} />
      <text x={cx - BW/2 + 22} y={cy + BH/2 + 4} fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10" fontWeight="500" fill="#1e293b">{label}</text>
    </g>
  );
}

export default function WorldMapSVG({ className, style }: Props) {
  return (
    <svg
      viewBox="0 0 960 500"
      preserveAspectRatio="xMidYMid slice"
      width="100%" height="100%"
      className={className} style={style}
      aria-hidden="true"
    >
      <defs>
        <filter id="bshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.10)" />
        </filter>
      </defs>

      {/* ── 1. City block background ── */}
      <rect width="960" height="500" fill={BLOCK} />

      {/* ── 2. Parks & green areas ── */}
      {/* Top-left corner park */}
      <rect x="0"   y="0"   width="110" height="75"  rx="3" fill={PARK} />
      {/* Top-center park */}
      <rect x="240" y="0"   width="130" height="55"  rx="3" fill={PARK} />
      {/* Mid-right park */}
      <rect x="555" y="75"  width="125" height="85"  rx="3" fill={PARK} />
      {/* Mid-left park */}
      <rect x="0"   y="170" width="85"  height="90"  rx="3" fill={PARK} />
      {/* Far-right tall park (y=170–418) */}
      <rect x="848" y="170" width="112" height="241" rx="3" fill={PARK} />
      {/* Central plaza (y=265–418) */}
      <rect x="248" y="272" width="134" height="139" rx="3" fill={PARK} />
      {/* Left-edge park strip (y=265–418) */}
      <rect x="7"   y="273" width="41"  height="138" rx="3" fill={PARK} />
      {/* Small pocket park bottom-center */}
      <rect x="563" y="375" width="51"  height="36"  rx="2" fill={PARK} />
      {/* Bottom parks (below y=418) */}
      <rect x="690" y="426" width="130" height="74"  rx="3" fill={PARK} />
      <rect x="460" y="426" width="95"  height="74"  rx="3" fill={PARK} />

      {/* ── 3. Building footprints ── */}

      {/* Block 110–240 / 0–75 */}
      <rect x="118" y="7"   width="56" height="28" rx="2" fill={BLDG} />
      <rect x="182" y="7"   width="50" height="28" rx="2" fill={BLDG} />
      <rect x="118" y="42"  width="40" height="26" rx="2" fill={BLDG} />
      <rect x="165" y="42"  width="67" height="26" rx="2" fill={BLDG} />

      {/* Block 390–555 / 0–75 */}
      <rect x="398" y="7"   width="70" height="28" rx="2" fill={BLDG} />
      <rect x="476" y="7"   width="71" height="28" rx="2" fill={BLDG} />
      <rect x="398" y="42"  width="50" height="26" rx="2" fill={BLDG} />
      <rect x="456" y="42"  width="91" height="26" rx="2" fill={BLDG} />

      {/* Block 690–840 / 0–75 */}
      <rect x="698" y="7"   width="60" height="30" rx="2" fill={BLDG} />
      <rect x="766" y="7"   width="66" height="30" rx="2" fill={BLDG} />
      <rect x="698" y="44"  width="80" height="24" rx="2" fill={BLDG} />

      {/* Block 110–240 / 75–170 */}
      <rect x="118" y="83"  width="55" height="38" rx="2" fill={BLDG} />
      <rect x="181" y="83"  width="51" height="38" rx="2" fill={BLDG} />
      <rect x="118" y="128" width="80" height="34" rx="2" fill={BLDG} />
      <rect x="206" y="128" width="26" height="34" rx="2" fill={BLDG} />

      {/* Block 240–390 / 75–170 */}
      <rect x="248" y="83"  width="62" height="36" rx="2" fill={BLDG} />
      <rect x="318" y="83"  width="64" height="36" rx="2" fill={BLDG} />
      <rect x="248" y="126" width="45" height="36" rx="2" fill={BLDG} />
      <rect x="300" y="126" width="82" height="36" rx="2" fill={BLDG} />

      {/* Block 390–555 / 75–170 */}
      <rect x="398" y="83"  width="75" height="38" rx="2" fill={BLDG} />
      <rect x="481" y="83"  width="66" height="38" rx="2" fill={BLDG} />
      <rect x="398" y="128" width="55" height="34" rx="2" fill={BLDG} />
      <rect x="461" y="128" width="86" height="34" rx="2" fill={BLDG} />

      {/* Block 690–840 / 170–265 */}
      <rect x="698" y="178" width="68" height="40" rx="2" fill={BLDG} />
      <rect x="774" y="178" width="58" height="40" rx="2" fill={BLDG} />
      <rect x="698" y="225" width="90" height="32" rx="2" fill={BLDG} />

      {/* Block 240–390 / 170–265 */}
      <rect x="248" y="178" width="60" height="40" rx="2" fill={BLDG} />
      <rect x="316" y="178" width="66" height="40" rx="2" fill={BLDG} />
      <rect x="248" y="226" width="88" height="32" rx="2" fill={BLDG} />

      {/* Block 110–240 / 265–418 */}
      <rect x="118" y="273" width="49" height="40" rx="2" fill={BLDG} />
      <rect x="183" y="273" width="49" height="40" rx="2" fill={BLDG} />
      <rect x="118" y="321" width="49" height="40" rx="2" fill={BLDG} />
      <rect x="183" y="321" width="49" height="40" rx="2" fill={BLDG} />
      <rect x="118" y="370" width="49" height="40" rx="2" fill={BLDG} />
      <rect x="183" y="370" width="49" height="40" rx="2" fill={BLDG} />

      {/* Block 390–472 / 265–418 */}
      <rect x="398" y="273" width="66" height="42" rx="2" fill={BLDG} />
      <rect x="398" y="323" width="66" height="40" rx="2" fill={BLDG} />
      <rect x="398" y="371" width="66" height="40" rx="2" fill={BLDG} />

      {/* Block 472–555 / 265–418 */}
      <rect x="480" y="273" width="67" height="42" rx="2" fill={BLDG} />
      <rect x="480" y="323" width="67" height="40" rx="2" fill={BLDG} />
      <rect x="480" y="371" width="67" height="40" rx="2" fill={BLDG} />

      {/* Block 555–622 / 265–418 (buildings above pocket park) */}
      <rect x="563" y="273" width="51" height="42" rx="2" fill={BLDG} />
      <rect x="563" y="323" width="51" height="44" rx="2" fill={BLDG} />

      {/* Block 622–690 / 265–418 */}
      <rect x="630" y="273" width="52" height="42" rx="2" fill={BLDG} />
      <rect x="630" y="323" width="52" height="40" rx="2" fill={BLDG} />
      <rect x="630" y="371" width="52" height="40" rx="2" fill={BLDG} />

      {/* Block 690–765 / 265–418 */}
      <rect x="698" y="273" width="59" height="42" rx="2" fill={BLDG} />
      <rect x="698" y="323" width="59" height="40" rx="2" fill={BLDG} />
      <rect x="698" y="371" width="59" height="40" rx="2" fill={BLDG} />

      {/* Block 765–840 / 265–418 */}
      <rect x="773" y="273" width="59" height="42" rx="2" fill={BLDG} />
      <rect x="773" y="323" width="59" height="40" rx="2" fill={BLDG} />
      <rect x="773" y="371" width="59" height="40" rx="2" fill={BLDG} />

      {/* Block 55–110 / 265–418 */}
      <rect x="63"  y="273" width="39" height="42" rx="2" fill={BLDG} />
      <rect x="63"  y="323" width="39" height="40" rx="2" fill={BLDG} />
      <rect x="63"  y="371" width="39" height="40" rx="2" fill={BLDG} />

      {/* ── 4. Street network ── */}

      {/* Diagonal boulevard (Haussmann) */}
      <line x1="0" y1="460" x2="616" y2="0" stroke={W} strokeWidth="20" strokeLinecap="round" />

      {/* Second curved diagonal — upper right */}
      <path d="M 480,0 C 580,55 680,130 780,185 S 900,240 960,260"
        stroke={W} strokeWidth="14" fill="none" strokeLinecap="round" />

      {/* Major horizontals */}
      <line x1="0"   y1="75"  x2="960" y2="75"  stroke={W} strokeWidth="14" />
      <line x1="0"   y1="170" x2="960" y2="170" stroke={W} strokeWidth="14" />
      <line x1="0"   y1="265" x2="960" y2="265" stroke={W} strokeWidth="14" />
      <line x1="0"   y1="418" x2="960" y2="418" stroke={W} strokeWidth="14" />

      {/* Major verticals */}
      <line x1="110" y1="0"   x2="110" y2="500" stroke={W} strokeWidth="14" />
      <line x1="240" y1="0"   x2="240" y2="500" stroke={W} strokeWidth="14" />
      <line x1="390" y1="0"   x2="390" y2="500" stroke={W} strokeWidth="14" />
      <line x1="555" y1="0"   x2="555" y2="500" stroke={W} strokeWidth="14" />
      <line x1="690" y1="0"   x2="690" y2="500" stroke={W} strokeWidth="14" />
      <line x1="840" y1="0"   x2="840" y2="500" stroke={W} strokeWidth="14" />

      {/* Minor horizontals */}
      <line x1="0"   y1="35"  x2="960" y2="35"  stroke={W} strokeWidth="7" />
      <line x1="0"   y1="122" x2="960" y2="122" stroke={W} strokeWidth="7" />
      <line x1="0"   y1="218" x2="960" y2="218" stroke={W} strokeWidth="7" />
      <line x1="0"   y1="340" x2="960" y2="340" stroke={W} strokeWidth="7" />
      <line x1="0"   y1="440" x2="960" y2="440" stroke={W} strokeWidth="7" />
      <line x1="0"   y1="475" x2="960" y2="475" stroke={W} strokeWidth="7" />

      {/* Minor verticals */}
      <line x1="55"  y1="0"   x2="55"  y2="500" stroke={W} strokeWidth="7" />
      <line x1="175" y1="0"   x2="175" y2="500" stroke={W} strokeWidth="7" />
      <line x1="315" y1="0"   x2="315" y2="500" stroke={W} strokeWidth="7" />
      <line x1="472" y1="0"   x2="472" y2="500" stroke={W} strokeWidth="7" />
      <line x1="622" y1="0"   x2="622" y2="500" stroke={W} strokeWidth="7" />
      <line x1="765" y1="0"   x2="765" y2="500" stroke={W} strokeWidth="7" />
      <line x1="900" y1="0"   x2="900" y2="500" stroke={W} strokeWidth="7" />

      {/* ── 5. Roundabouts ── */}
      {/* Main roundabout at diagonal × y=170 × x=390 */}
      <circle cx="390" cy="170" r="30" fill={W} />
      <circle cx="390" cy="170" r="23" fill={BLOCK} stroke="#c0c0c0" strokeWidth="1.5" />
      <circle cx="390" cy="170" r="8"  fill={PARK} />

      {/* Secondary roundabout at x=555, y=265 */}
      <circle cx="555" cy="265" r="22" fill={W} />
      <circle cx="555" cy="265" r="16" fill={BLOCK} stroke="#c8c8c8" strokeWidth="1" />
      <circle cx="555" cy="265" r="6"  fill={PARK} />

      {/* ── 6. Animated event bubbles ── */}
      {EVENTS.map(e => <Bubble key={e.label} {...e} />)}
    </svg>
  );
}
