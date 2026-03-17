'use client';

import { useEffect, useState } from 'react';
import WorldMapSVG from './WorldMapSVG';

const FLIP_AT_MS = 5000;
const CARD_AT_MS = FLIP_AT_MS + 1200;

const PANEL_X = 648;
const CCX     = 714;
const TX      = 750;
const R       = 22;
const GAP     = 10;
const CYS     = [115, 248, 381] as const;
const CLS     = CYS[1] - CYS[0] - 2 * (R + GAP);

const BLUE  = '#0d6efd'; // dashboard blue (right panel)
const CBLUE = '#3b82f6'; // customer app blue (passport)

type IconType = 'package' | 'document' | 'check';
interface Step { cy: number; label: string; sub: string; icon: IconType; nb: string; lb: string | null; }

const STEPS: Step[] = [
  { cy: CYS[0], label: 'Producto',   sub: 'Nuevo ítem en el sistema',   icon: 'package',  nb: '0.2s', lb: null    },
  { cy: CYS[1], label: 'Registrado', sub: 'ID único asignado',          icon: 'document', nb: '1.1s', lb: '0.5s' },
  { cy: CYS[2], label: 'Verificado', sub: 'Autenticidad confirmada',    icon: 'check',    nb: '2.0s', lb: '1.4s' },
];

const SEAL_NB = '2.5s';

function Icon({ cx, cy, type }: { cx: number; cy: number; type: IconType }) {
  const g = { stroke: BLUE, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  if (type === 'package') return (
    <g {...g}>
      <rect x={cx - 10} y={cy - 11} width={20} height={22} rx={2} />
      <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} />
      <line x1={cx} y1={cy - 11} x2={cx} y2={cy} />
    </g>
  );
  if (type === 'document') return (
    <g {...g}>
      <rect x={cx - 8} y={cy - 12} width={16} height={24} rx={2} />
      <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy - 5} />
      <line x1={cx - 5} y1={cy}     x2={cx + 5} y2={cy}     />
      <line x1={cx - 5} y1={cy + 5} x2={cx + 1} y2={cy + 5} />
    </g>
  );
  return (
    <path d={`M${cx - 9},${cy} L${cx - 3},${cy + 8} L${cx + 10},${cy - 9}`}
      stroke={BLUE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  );
}

// Timeline items mirroring the customer passport history tab
const TIMELINE = [
  { title: 'Producto añadido',  desc: 'Registrado en el sistema de certificación',    date: '17 mar · 09:41', verified: false, nb: STEPS[0].nb },
  { title: 'Registrado',        desc: 'ID único asignado · verificado digitalmente',  date: '17 mar · 09:52', verified: true,  nb: STEPS[1].nb },
  { title: 'Verificado',        desc: 'Autenticidad confirmada en blockchain',         date: '17 mar · 10:05', verified: true,  nb: STEPS[2].nb },
];
// y-top of each timeline card
const TL_Y = [156, 235, 314] as const;

function IntroSVG() {
  // Passport card geometry — fills left panel (0–648)
  const CX = 52, CY = 22, CW = 540, CH = 452;

  return (
    <svg viewBox="0 0 960 500" preserveAspectRatio="xMidYMid slice"
      width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true">
      <defs>
        {/* Background gradients */}
        <radialGradient id="bg1" cx="15%" cy="0%" r="80%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="rgba(59,130,246,0.16)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0)"    />
        </radialGradient>
        <radialGradient id="bg2" cx="88%" cy="12%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="rgba(96,165,250,0.10)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)"    />
        </radialGradient>

        {/* Card shadow */}
        <filter id="cshadow" x="-15%" y="-8%" width="130%" height="124%">
          <feDropShadow dx="0" dy="10" stdDeviation="22" floodColor="rgba(0,0,0,0.08)" />
          <feDropShadow dx="0" dy="2"  stdDeviation="4"  floodColor="rgba(0,0,0,0.04)" />
        </filter>

        {/* Product image placeholder gradient: #f1f5f9 → #e2e8f0 */}
        <linearGradient id="imgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* TimestampBadge gradient: #eff6ff → #dbeafe */}
        <linearGradient id="tsBadge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>

        {/* Blockchain seal gradient: #ecfdf5 → #d1fae5 */}
        <linearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>

        {/* Subtle dot texture */}
        <pattern id="dotPat" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="rgba(59,130,246,0.12)" />
        </pattern>

        {/* Right panel gradient */}
        <linearGradient id="rpGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(13,110,253,0.04)" />
          <stop offset="100%" stopColor="rgba(13,110,253,0.07)" />
        </linearGradient>
      </defs>

      {/* ── Background ── */}
      <rect width="960" height="500" fill="#f8fafc" />
      <rect width="960" height="500" fill="url(#bg1)" />
      <rect width="960" height="500" fill="url(#bg2)" />
      <rect width="960" height="500" fill="url(#dotPat)" opacity="0.55" />

      {/* ── Passport card shell ── */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" begin="0s" fill="freeze" />
        <rect x={CX} y={CY} width={CW} height={CH} rx="16"
          fill="rgba(255,255,255,0.97)" filter="url(#cshadow)"
          stroke="rgba(226,232,240,0.7)" strokeWidth="1" />
      </g>

      {/* ── Card header: back button + title ── */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" begin="0s" fill="freeze" />
        {/* Back button — glassmorphic style matching passportStyles.backButton */}
        <rect x="68" y="34" width="52" height="20" rx="6"
          fill="rgba(255,255,255,0.9)" stroke="rgba(226,232,240,0.7)" strokeWidth="1" />
        <path d="M78,44 L74,44 M74,44 L77,41 M74,44 L77,47"
          stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="82" y="47" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="8.5" fontWeight="500" fill="#64748b">Volver</text>
        {/* headerTitle */}
        <text x="130" y="47" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="12" fontWeight="600" fill="#1e293b">Información de producto</text>
        {/* Divider below header row */}
        <line x1="68" y1="60" x2="576" y2="60" stroke="#e2e8f0" strokeWidth="1" />
      </g>

      {/* ── Tabs (Información active, Historial inactive) ── */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" begin="0s" fill="freeze" />
        <text x="68" y="145" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="10.5" fontWeight="500" fill={CBLUE}>Información</text>
        <text x="136" y="145" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="10.5" fontWeight="500" fill="#64748b">Historial</text>
        {/* Tab border */}
        <line x1="68" y1="149" x2="576" y2="149" stroke="#e2e8f0" strokeWidth="1" />
        {/* Active underline */}
        <line x1="68" y1="149" x2="130" y2="149" stroke={CBLUE} strokeWidth="2" />
      </g>

      {/* ── Product header (itemHeader) — appears with step 1 ── */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" begin={STEPS[0].nb} fill="freeze" />

        {/* itemImage: 56×56, rx=10, placeholder gradient */}
        <rect x="68" y="66" width="56" height="56" rx="10" fill="url(#imgGrad)" />
        {/* Package icon inside placeholder */}
        <g stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="80" y="76" width="20" height="22" rx="2" />
          <line x1="80" y1="87" x2="100" y2="87" />
          <line x1="90" y1="76" x2="90" y2="87" />
        </g>

        {/* itemTitle */}
        <text x="134" y="82" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="13" fontWeight="600" fill="#1e293b">Artículo de demostración</text>

        {/* VerifiedBadge — green filled circle with white checkmark */}
        <circle cx="306" cy="77" r="7.5" fill="#22c55e" />
        <path d="M302,77 L304.5,80.5 L310.5,72"
          stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* itemDescription */}
        <text x="134" y="97" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="9.5" fill="#64748b">Producto de demostración certificado</text>

        {/* itemMeta: ID + date */}
        <text x="134" y="113" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="8.5" fill="#94a3b8">ID: PRD-2024-0891</text>
        <text x="250" y="113" fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="8.5" fill="#94a3b8">Creado: 17 mar 2024</text>

        {/* Divider after product header */}
        <line x1="68" y1="130" x2="576" y2="130" stroke="#e2e8f0" strokeWidth="1" />
      </g>

      {/* ── Timeline vertical line (timelineStyles.line) ── */}
      <line x1="84" y1="156" x2="84" y2="382"
        stroke="#e2e8f0" strokeWidth="2" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" begin={STEPS[0].nb} fill="freeze" />
      </line>

      {/* ── Timeline items ── */}
      {TIMELINE.map((item, i) => (
        <g key={item.title} opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.35s" begin={item.nb} fill="freeze" />

          {/* timelineStyles.dot: blue circle, white border, outer #e2e8f0 ring */}
          <circle cx={84} cy={TL_Y[i] + 10} r={10}
            fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx={84} cy={TL_Y[i] + 10} r={7}
            fill={CBLUE} stroke="white" strokeWidth="2.5" />

          {/* timelineStyles.card: #f8fafc bg, rx=10, blue left border */}
          <rect x={102} y={TL_Y[i]} width={474} height={68} rx={10}
            fill="#f8fafc" stroke="rgba(226,232,240,0.8)" strokeWidth="1" />
          {/* Left border accent: 4px solid #3b82f6 */}
          <line x1={104} y1={TL_Y[i] + 8} x2={104} y2={TL_Y[i] + 60}
            stroke={CBLUE} strokeWidth="4" strokeLinecap="round" />

          {/* TimestampBadge: blue gradient pill, top-right of card */}
          <rect x={472} y={TL_Y[i] + 8} width={96} height={18} rx={4}
            fill="url(#tsBadge)" />
          {/* Clock icon */}
          <circle cx={481} cy={TL_Y[i] + 17} r={5}
            stroke={CBLUE} strokeWidth="1.2" fill="none" />
          <line x1={481} y1={TL_Y[i] + 13.5} x2={481} y2={TL_Y[i] + 17}
            stroke={CBLUE} strokeWidth="1.2" strokeLinecap="round" />
          <line x1={481} y1={TL_Y[i] + 17} x2={484} y2={TL_Y[i] + 19}
            stroke={CBLUE} strokeWidth="1.2" strokeLinecap="round" />
          <text x={488} y={TL_Y[i] + 21}
            fontFamily="ui-sans-serif,system-ui,sans-serif"
            fontSize="7.5" fontWeight="500" fill="#1e40af">{item.date}</text>

          {/* State title */}
          <text x={114} y={TL_Y[i] + 22}
            fontFamily="ui-sans-serif,system-ui,sans-serif"
            fontSize="11" fontWeight="600" fill="#1e293b">{item.title}</text>

          {/* VerifiedBadge inline with title (items 1 & 2) */}
          {item.verified && (
            <g>
              <circle cx={185} cy={TL_Y[i] + 17} r={7.5} fill="#22c55e" />
              <path d={`M181.5,${TL_Y[i] + 17} L184,${TL_Y[i] + 20.5} L190.5,${TL_Y[i] + 13.5}`}
                stroke="white" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          )}

          {/* State description */}
          <text x={114} y={TL_Y[i] + 37}
            fontFamily="ui-sans-serif,system-ui,sans-serif"
            fontSize="9" fill="#64748b">{item.desc}</text>
        </g>
      ))}

      {/* ── Blockchain verification seal (appears last) ── */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.5s" begin={SEAL_NB} fill="freeze" />
        <rect x="68" y="400" width="508" height="46" rx="10"
          fill="url(#sealGrad)" stroke="#4ade80" strokeWidth="1" />
        {/* Check icon */}
        <circle cx="88" cy="423" r="13" fill="rgba(34,197,94,0.15)" />
        <circle cx="88" cy="423" r="8"
          fill="none" stroke="#22c55e" strokeWidth="1.5" />
        <path d="M84.5,423 L87,426.5 L92.5,418"
          stroke="#22c55e" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Text */}
        <text x="108" y="420"
          fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="11" fontWeight="600" fill="#065f46">Verificado en blockchain</text>
        <text x="108" y="436"
          fontFamily="ui-sans-serif,system-ui,sans-serif"
          fontSize="8.5" fill="#047857">Registro en cadena de custodia inmutable · iCommunity Labs</text>
      </g>

      {/* ── Right panel separator + tint ── */}
      <line x1={PANEL_X} y1="0" x2={PANEL_X} y2="500"
        stroke="rgba(13,110,253,0.14)" strokeWidth="1" />
      <rect x={PANEL_X} y="0" width={960 - PANEL_X} height="500"
        fill="url(#rpGrad)" />
      <rect x={PANEL_X} y="0" width={960 - PANEL_X} height="500"
        fill="url(#dotPat)" opacity="0.85" />

      {/* ── Steps (right panel) ── */}
      {STEPS.map((s, i) => {
        const prev = STEPS[i - 1];
        const ly1 = prev ? prev.cy + R + GAP : null;
        const ly2 = ly1  ? s.cy  - R - GAP : null;
        return (
          <g key={s.label}>
            {ly1 && ly2 && s.lb && (
              <line x1={CCX} y1={ly1} x2={CCX} y2={ly2}
                stroke="rgba(13,110,253,0.28)" strokeWidth="2"
                strokeDasharray={CLS} strokeDashoffset={CLS}>
                <animate attributeName="stroke-dashoffset"
                  from={CLS} to={0} dur="0.4s" begin={s.lb} fill="freeze" />
              </line>
            )}
            <g opacity="0">
              <animate attributeName="opacity" values="0;1" dur="0.35s" begin={s.nb} fill="freeze" />
              <circle cx={CCX} cy={s.cy} r={R + 9} fill="none" stroke={BLUE} strokeWidth="1" opacity="0.08" />
              <circle cx={CCX} cy={s.cy} r={R} fill="#ffffff" stroke={BLUE} strokeWidth="1.8" />
              <Icon cx={CCX} cy={s.cy} type={s.icon} />
              <circle cx={CCX + R - 1} cy={s.cy - R + 1} r={6.5} fill={BLUE} />
              <text x={CCX + R - 1} y={s.cy - R + 5}
                textAnchor="middle" fontFamily="ui-sans-serif,system-ui,sans-serif"
                fontSize="7" fontWeight="700" fill="#ffffff">
                {i + 1}
              </text>
              <text x={TX} y={s.cy - 4}
                fontFamily="ui-sans-serif,system-ui,sans-serif"
                fontSize="13" fontWeight="600" fill="#0f172a">
                {s.label}
              </text>
              <text x={TX} y={s.cy + 13}
                fontFamily="ui-sans-serif,system-ui,sans-serif"
                fontSize="9.5" fill="#64748b">
                {s.sub}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

interface Props {
  onMapReady?: () => void;
  skipIntro?: boolean;
}

export default function IntroBackgroundAnimation({ onMapReady, skipIntro }: Props) {
  const [showMap, setShowMap] = useState(skipIntro ?? false);

  useEffect(() => {
    if (skipIntro) { onMapReady?.(); return; }
    const t1 = setTimeout(() => setShowMap(true), FLIP_AT_MS);
    const t2 = setTimeout(() => onMapReady?.(), CARD_AT_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onMapReady, skipIntro]);

  return (
    <div style={{ width: '100%', height: '100%', perspective: '2400px' }}>
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: skipIntro ? 'none' : 'transform 1.5s cubic-bezier(0.77,0,0.175,1)',
        transform: showMap ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <IntroSVG />
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <WorldMapSVG style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  );
}
