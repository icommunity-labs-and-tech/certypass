'use client';

const CBLUE = '#3b82f6';

const T = ['0.2s', '1.1s', '2.0s'] as const;

const ITEMS = [
  { title: 'Producto añadido',  desc: 'Registrado en el sistema de certificación',    date: '17 mar · 09:41', verified: false, nb: T[0] },
  { title: 'Registrado',        desc: 'ID único asignado · certificado digitalmente',  date: '17 mar · 09:52', verified: true,  nb: T[1] },
  { title: 'Verificado',        desc: 'Autenticidad confirmada en blockchain',          date: '17 mar · 10:05', verified: true,  nb: T[2] },
];

// 3 items × 116 px + 2 gaps × 16 px = 380 px → centred in 440 px viewBox (30 px top/bottom)
const ITEM_H = 116;
const GAP    = 16;
const START  = (440 - (3 * ITEM_H + 2 * GAP)) / 2; // = 30
const TL_Y   = [START, START + ITEM_H + GAP, START + 2 * (ITEM_H + GAP)] as const;

// Horizontal: 14 px margins each side (glow ring = r 12, dot centre at x 26)
const DOT_X = 26;
const DOT_R = 8;
const CARD_X = 46;
const CARD_W = 300; // right edge = 346, right margin = 14 px

export default function StepsSVG() {
  return (
    <svg viewBox="0 0 360 440" width="100%" height="100%"
      style={{ display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id="tsBadge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="bcBadge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#ede9fe" />
        </linearGradient>
      </defs>

      {/* Timeline vertical line */}
      <line
        x1={DOT_X} y1={TL_Y[0] + 16} x2={DOT_X} y2={TL_Y[2] + 16}
        stroke="#e2e8f0" strokeWidth="2" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" begin={T[0]} fill="freeze" />
      </line>

      {ITEMS.map((item, i) => {
        const cy = TL_Y[i] + 16;

        return (
          <g key={item.title} opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.35s" begin={item.nb} fill="freeze" />

            {/* Dot */}
            <circle cx={DOT_X} cy={cy} r={DOT_R + 4} fill="none" stroke={CBLUE} strokeWidth="1" opacity="0.10" />
            <circle cx={DOT_X} cy={cy} r={DOT_R}     fill={CBLUE} stroke="white" strokeWidth="2.5" />

            {/* Card */}
            <rect x={CARD_X} y={TL_Y[i]} width={CARD_W} height={ITEM_H} rx={10}
              fill="#f8fafc" stroke="rgba(226,232,240,0.8)" strokeWidth="1" />
            <line x1={CARD_X + 2} y1={TL_Y[i] + 9} x2={CARD_X + 2} y2={TL_Y[i] + ITEM_H - 9}
              stroke={CBLUE} strokeWidth="4" strokeLinecap="round" />

            {/* TimestampBadge */}
            <rect x={CARD_X + CARD_W - 92} y={TL_Y[i] + 8} width={88} height={18} rx={4} fill="url(#tsBadge)" />
            <circle cx={CARD_X + CARD_W - 83} cy={TL_Y[i] + 17} r={4.5} stroke={CBLUE} strokeWidth="1" fill="none" />
            <line x1={CARD_X + CARD_W - 83} y1={TL_Y[i] + 13.5} x2={CARD_X + CARD_W - 83} y2={TL_Y[i] + 17}
              stroke={CBLUE} strokeWidth="1" strokeLinecap="round" />
            <line x1={CARD_X + CARD_W - 83} y1={TL_Y[i] + 17}   x2={CARD_X + CARD_W - 80} y2={TL_Y[i] + 19}
              stroke={CBLUE} strokeWidth="1" strokeLinecap="round" />
            <text x={CARD_X + CARD_W - 76} y={TL_Y[i] + 21}
              fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="7.5" fontWeight="500" fill="#1e40af">
              {item.date}
            </text>

            {/* Title */}
            <text x={CARD_X + 10} y={TL_Y[i] + 30}
              fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="13" fontWeight="600" fill="#1e293b">
              {item.title}
            </text>

            {/* VerifiedBadge */}
            {item.verified && (() => {
              const bx = CARD_X + 10 + (item.title === 'Registrado' ? 78 : 75) + 8;
              const bcy = TL_Y[i] + 25;
              return (
                <g>
                  <circle cx={bx} cy={bcy} r={8} fill="#22c55e" />
                  <path d={`M${bx - 3.5},${bcy} L${bx - 1},${bcy + 3.5} L${bx + 4.5},${bcy - 3.5}`}
                    stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>
              );
            })()}

            {/* Separator */}
            <line x1={CARD_X + 10} y1={TL_Y[i] + 44} x2={CARD_X + CARD_W - 10} y2={TL_Y[i] + 44}
              stroke="#f1f5f9" strokeWidth="1" />

            {/* Description */}
            <text x={CARD_X + 10} y={TL_Y[i] + 58}
              fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="9.5" fill="#64748b">
              {item.desc}
            </text>

            {/* Blockchain badge (verified only) */}
            {item.verified && (
              <g>
                <rect x={CARD_X + 10} y={TL_Y[i] + 70} width={176} height={22} rx={5}
                  fill="url(#bcBadge)" stroke="rgba(139,92,246,0.30)" strokeWidth="1" />
                <circle cx={CARD_X + 21} cy={TL_Y[i] + 81} r={5.5} fill="none" stroke="#8b5cf6" strokeWidth="1.2" />
                <path d={`M${CARD_X + 18.5},${TL_Y[i] + 81} L${CARD_X + 20.5},${TL_Y[i] + 83.5} L${CARD_X + 24.5},${TL_Y[i] + 78}`}
                  stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <text x={CARD_X + 31} y={TL_Y[i] + 85}
                  fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8.5" fontWeight="500" fill="#6d28d9">
                  Verificado en blockchain
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
