import {
  EARTH_DECORATIONS,
  type DecorationKind,
  type EarthDecoration,
} from '../doll/earthScroll'

type EarthGlobeProps = {
  rotationDeg: number
  className?: string
}

const CX = 200
const CY = 200
const RADIUS = 168
/** Rim radius inset so trunks sit on the surface; foliage may extend outside the disc. */
const DECOR_RADIUS = 162
/** Extra viewBox padding so trees/houses/clouds are not clipped at the SVG edge. */
const VIEW_PAD = 56

function DecorationMark({ kind }: { kind: DecorationKind }) {
  switch (kind) {
    case 'tree':
      return (
        <g>
          <rect x="-3" y="-18" width="6" height="18" rx="2" fill="#6b4423" />
          <circle cx="0" cy="-28" r="14" fill="#3d8b4a" />
          <circle cx="-8" cy="-22" r="9" fill="#4fa05a" />
          <circle cx="8" cy="-22" r="9" fill="#4fa05a" />
        </g>
      )
    case 'house':
      return (
        <g>
          <rect x="-12" y="-22" width="24" height="18" rx="2" fill="#e8d5b5" />
          <path d="M -16 -22 L 0 -36 L 16 -22 Z" fill="#c45c26" />
          <rect x="-4" y="-14" width="8" height="10" rx="1" fill="#1b263b" />
          <rect x="6" y="-16" width="6" height="6" rx="1" fill="#7eb8da" />
        </g>
      )
    case 'animal':
      return (
        <g>
          <ellipse cx="0" cy="-10" rx="12" ry="8" fill="#f4f0e6" />
          <circle cx="10" cy="-16" r="6" fill="#f4f0e6" />
          <circle cx="12" cy="-17" r="1.5" fill="#1b263b" />
          <rect x="-8" y="-4" width="4" height="8" rx="1" fill="#d4cfc4" />
          <rect x="4" y="-4" width="4" height="8" rx="1" fill="#d4cfc4" />
          <ellipse cx="-10" cy="-8" rx="3" ry="5" fill="#f4f0e6" />
        </g>
      )
    case 'hill':
      return (
        <g>
          <ellipse cx="0" cy="-6" rx="22" ry="12" fill="#5a8f3c" />
          <ellipse cx="-8" cy="-10" rx="10" ry="6" fill="#6ba04a" />
        </g>
      )
    case 'cloud':
      return (
        <g>
          <ellipse cx="0" cy="-40" rx="16" ry="9" fill="#e8f1f8" opacity="0.92" />
          <ellipse cx="-10" cy="-36" rx="10" ry="7" fill="#e8f1f8" opacity="0.92" />
          <ellipse cx="10" cy="-36" rx="10" ry="7" fill="#e8f1f8" opacity="0.92" />
        </g>
      )
  }
}

function RimDecoration({
  decoration,
}: {
  decoration: EarthDecoration
}) {
  return (
    <g transform={`rotate(${decoration.angleDeg} ${CX} ${CY})`}>
      <g transform={`translate(${CX} ${CY - DECOR_RADIUS})`}>
        <DecorationMark kind={decoration.kind} />
      </g>
    </g>
  )
}

/**
 * Cartoon Earth globe: ocean/land disc with rim scenery that scrolls via rotationDeg.
 */
export function EarthGlobe({ rotationDeg, className }: EarthGlobeProps) {
  return (
    <svg
      className={className}
      viewBox={`${-VIEW_PAD} ${-VIEW_PAD} ${400 + VIEW_PAD * 2} ${400 + VIEW_PAD * 2}`}
      width="400"
      height="400"
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      <defs>
        <clipPath id="earth-globe-clip">
          <circle cx={CX} cy={CY} r={RADIUS} />
        </clipPath>
      </defs>

      {/* Soft glow behind planet */}
      <circle cx={CX} cy={CY} r={RADIUS + 10} fill="rgba(36, 123, 160, 0.22)" />

      <g transform={`rotate(${rotationDeg} ${CX} ${CY})`}>
        <circle cx={CX} cy={CY} r={RADIUS} fill="#1f6f8b" />

        <g clipPath="url(#earth-globe-clip)">
          <ellipse cx="120" cy="150" rx="70" ry="45" fill="#5a8f3c" />
          <ellipse cx="280" cy="210" rx="85" ry="55" fill="#4e7f34" />
          <ellipse cx="200" cy="300" rx="60" ry="40" fill="#6b9e4a" />
          <ellipse cx="90" cy="260" rx="40" ry="28" fill="#6b4423" opacity="0.55" />
          <ellipse cx="310" cy="120" rx="35" ry="22" fill="#5a8f3c" />
        </g>

        {EARTH_DECORATIONS.map((decoration) => (
          <RimDecoration key={decoration.id} decoration={decoration} />
        ))}
      </g>

      {/* Atmosphere rim + mild highlight (fixed, not scrolling) */}
      <circle
        cx={CX}
        cy={CY}
        r={RADIUS}
        fill="none"
        stroke="rgba(227, 242, 253, 0.28)"
        strokeWidth="3"
      />
      <ellipse
        cx="145"
        cy="145"
        rx="48"
        ry="28"
        fill="rgba(255, 255, 255, 0.12)"
        transform={`rotate(-25 ${CX} ${CY})`}
      />
    </svg>
  )
}
