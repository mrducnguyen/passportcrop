import type { PassportSpec } from '../utils/passportSpecs.ts'
import type { FrameRect } from '../utils/cropImage.ts'

interface Props {
  containerW: number
  containerH: number
  frame: FrameRect
  spec: PassportSpec
}

export default function PassportOverlay({ containerW, containerH, frame }: Props) {
  const { x: fx, y: fy, w: fw, h: fh } = frame

  // Guide line positions in container pixels
  const crownY  = fy + fh * 0.08
  const chinY   = fy + fh * 0.83
  const eyeY    = fy + fh * 0.37

  // Face oval dimensions — use spec.guides but compute from frame
  const ovalRx = (fw * 0.68) / 2
  const ovalRy = (chinY - crownY) / 2
  const ovalCx = fx + fw / 2
  const ovalCy = crownY + ovalRy

  // Guide line x extents (slightly inside frame)
  const lineX1 = fx + fw * 0.08
  const lineX2 = fx + fw * 0.92

  // Label positions (right of frame)
  const labelX = fx + fw + 8

  // Dark cutout mask: full rect minus passport frame
  const maskPath = [
    `M 0 0 H ${containerW} V ${containerH} H 0 Z`,
    `M ${fx} ${fy} H ${fx + fw} V ${fy + fh} H ${fx} Z`,
  ].join(' ')

  return (
    <svg
      width={containerW}
      height={containerH}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none' }}
    >
      {/* Dark overlay outside passport frame */}
      <path d={maskPath} fillRule="evenodd" fill="rgba(0,0,0,0.62)" />

      {/* Passport frame border */}
      <rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke="white" strokeWidth="1.5" />

      {/* Corner ticks for precision alignment */}
      {[
        [fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh],
      ].map(([cx, cy], i) => {
        const dx = cx === fx ? 1 : -1
        const dy = cy === fy ? 1 : -1
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + dx * 12} y2={cy} stroke="white" strokeWidth="2" />
            <line x1={cx} y1={cy} x2={cx} y2={cy + dy * 12} stroke="white" strokeWidth="2" />
          </g>
        )
      })}

      {/* Face oval guide */}
      <ellipse
        cx={ovalCx}
        cy={ovalCy}
        rx={ovalRx}
        ry={ovalRy}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />

      {/* Crown / top-of-head line */}
      <line
        x1={lineX1} y1={crownY}
        x2={lineX2} y2={crownY}
        stroke="#facc15"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <text x={labelX} y={crownY + 4} fill="#facc15" fontSize="10" fontFamily="system-ui">
        crown
      </text>

      {/* Chin line */}
      <line
        x1={lineX1} y1={chinY}
        x2={lineX2} y2={chinY}
        stroke="#facc15"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <text x={labelX} y={chinY + 4} fill="#facc15" fontSize="10" fontFamily="system-ui">
        chin
      </text>

      {/* Eye level line */}
      <line
        x1={lineX1} y1={eyeY}
        x2={lineX2} y2={eyeY}
        stroke="rgba(96,205,255,0.7)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <text x={labelX} y={eyeY + 4} fill="rgba(96,205,255,0.85)" fontSize="10" fontFamily="system-ui">
        eyes
      </text>

      {/* Dimension label (bottom of frame) */}
      <text
        x={fx + fw / 2}
        y={fy + fh + 18}
        fill="rgba(255,255,255,0.5)"
        fontSize="11"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        face height guide inside
      </text>
    </svg>
  )
}
