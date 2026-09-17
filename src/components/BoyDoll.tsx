import type { JointPose } from '../doll/joints'

type BoyDollProps = {
  pose: JointPose
  className?: string
  outfit?: 'default' | 'ninja' | 'astronaut'
  expression?: 'neutral' | 'happy' | 'surprised' | 'cool'
}

function limbTransform(x: number, y: number, deg: number): string {
  return `translate(${x} ${y}) rotate(${deg})`
}

export function BoyDoll({ pose, className, outfit = 'default', expression = 'neutral' }: BoyDollProps) {
  let pants = '#3d5a80'
  let shoes = '#1b263b'
  let shirt = '#f7941d'
  let stripe = '#ffde59'
  let skin = '#ffcc99'
  let hair = '#5c4033'
  let helmet = false
  
  if (outfit === 'ninja') {
    pants = '#1a1a1a'
    shoes = '#000000'
    shirt = '#2c2c2c'
    stripe = '#e63946'
    hair = '#111'
  } else if (outfit === 'astronaut') {
    pants = '#ffffff'
    shoes = '#cccccc'
    shirt = '#eeeeee'
    stripe = '#1d3557'
    helmet = true
  }

  let eyes = (
    <>
      <ellipse cx="-10" cy="-30" rx="4" ry="5" fill="#1b263b" />
      <ellipse cx="10" cy="-30" rx="4" ry="5" fill="#1b263b" />
    </>
  )
  
  if (expression === 'happy') {
    eyes = (
      <>
        <path d="M -14 -30 Q -10 -35 -6 -30" fill="none" stroke="#1b263b" strokeWidth="3" strokeLinecap="round" />
        <path d="M 6 -30 Q 10 -35 14 -30" fill="none" stroke="#1b263b" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  } else if (expression === 'cool') {
    eyes = (
      <>
        <rect x="-16" y="-33" width="12" height="6" rx="2" fill="#111" />
        <rect x="4" y="-33" width="12" height="6" rx="2" fill="#111" />
        <path d="M -4 -30 L 4 -30" stroke="#111" strokeWidth="2" />
      </>
    )
  } else if (expression === 'surprised') {
    eyes = (
      <>
        <circle cx="-10" cy="-32" r="5" fill="#1b263b" />
        <circle cx="10" cy="-32" r="5" fill="#1b263b" />
      </>
    )
  }

  let mouth = <path d="M -8 -16 Q 0 -10 8 -16" fill="none" stroke="#c47a5a" strokeWidth="3" strokeLinecap="round" />
  if (expression === 'surprised') {
    mouth = <circle cx="0" cy="-14" r="4" fill="#c47a5a" />
  } else if (expression === 'happy') {
    mouth = <path d="M -10 -16 Q 0 -5 10 -16" fill="none" stroke="#c47a5a" strokeWidth="3" strokeLinecap="round" />
  }

  return (
    <svg
      className={className}
      viewBox="0 0 200 280"
      width="200"
      height="280"
      role="img"
      aria-label="Cartoon boy doll"
    >
      <g
        transform={limbTransform(
          100 + pose.rootX,
          140 + pose.rootY,
          pose.rootRot,
        )}
      >
        {/* Legs first (behind torso) */}
        <g transform={limbTransform(-12, 28, pose.upperLegL)}>
          <rect x="-8" y="0" width="16" height="36" rx="8" fill={pants} />
          <g transform={limbTransform(0, 34, pose.lowerLegL)}>
            <rect x="-7" y="0" width="14" height="32" rx="7" fill={pants} />
            <ellipse cx="2" cy="34" rx="12" ry="6" fill={shoes} />
          </g>
        </g>
        <g transform={limbTransform(12, 28, pose.upperLegR)}>
          <rect x="-8" y="0" width="16" height="36" rx="8" fill={pants} />
          <g transform={limbTransform(0, 34, pose.lowerLegR)}>
            <rect x="-7" y="0" width="14" height="32" rx="7" fill={pants} />
            <ellipse cx="-2" cy="34" rx="12" ry="6" fill={shoes} />
          </g>
        </g>

        {/* Torso */}
        <g transform={limbTransform(0, 0, pose.torso)}>
          <rect x="-28" y="-36" width="56" height="68" rx="18" fill={shirt} />
          <rect x="-22" y="-8" width="44" height="12" rx="4" fill={stripe} />

          {/* Head */}
          <g transform={limbTransform(0, -36, pose.head)}>
            {helmet && <circle cx="0" cy="-28" r="42" fill="rgba(255,255,255,0.4)" stroke="#fff" strokeWidth="2" />}
            <circle cx="0" cy="-28" r="32" fill={skin} />
            {eyes}
            {mouth}
            {/* Simple hair blob */}
            {outfit !== 'ninja' && (
              <path
                d="M -28 -36 Q 0 -62 28 -36 Q 20 -48 0 -50 Q -20 -48 -28 -36"
                fill={hair}
              />
            )}
            {outfit === 'ninja' && (
              <path
                d="M -32 -32 Q 0 -65 32 -32 L 32 -10 L -32 -10 Z"
                fill={hair}
                opacity={0.9}
              />
            )}
          </g>

          {/* Arms */}
          <g transform={limbTransform(-28, -24, pose.upperArmL)}>
            <rect x="-8" y="0" width="16" height="34" rx="8" fill={shirt} />
            <g transform={limbTransform(0, 32, pose.lowerArmL)}>
              <rect x="-7" y="0" width="14" height="30" rx="7" fill={skin} />
              <circle cx="0" cy="32" r="9" fill={skin} />
            </g>
          </g>
          <g transform={limbTransform(28, -24, pose.upperArmR)}>
            <rect x="-8" y="0" width="16" height="34" rx="8" fill={shirt} />
            <g transform={limbTransform(0, 32, pose.lowerArmR)}>
              <rect x="-7" y="0" width="14" height="30" rx="7" fill={skin} />
              <circle cx="0" cy="32" r="9" fill={skin} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
