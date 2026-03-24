import { cx } from '@emotion/css'
import type { PassportSpec } from '../utils/passportSpecs.ts'
import type { FrameRect } from '../utils/cropImage.ts'
import { s } from './PassportOverlay.styles.ts'

interface Props {
  containerW: number
  containerH: number
  frame: FrameRect
  spec: PassportSpec
}

export default function PassportOverlay({ containerW, containerH, frame }: Props) {
  const { x: fx, y: fy, w: fw, h: fh } = frame

  // Guide line positions in container pixels
  const crownY = fy + fh * 0.08
  const chinY  = fy + fh * 0.83
  const eyeY   = fy + fh * 0.37

  // Face oval dimensions — computed from frame
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
    <>
      {/* Dark overlay outside passport frame — no blend mode, sits as a plain layer */}
      <svg className={s.svgLayer} width={containerW} height={containerH}>
        <path className={s.mask} fillRule="evenodd" d={maskPath} />
      </svg>

      {/* Guide elements — mix-blend-mode on the <svg> so it applies to the composited layer */}
      <svg className={cx(s.svgLayer, s.guidesLayer)} width={containerW} height={containerH}>
        {/* Passport frame border */}
        <rect className={s.frameRect} x={fx} y={fy} width={fw} height={fh} />

        {/* Corner ticks */}
        {([
          [fx,      fy     ],
          [fx + fw, fy     ],
          [fx,      fy + fh],
          [fx + fw, fy + fh],
        ] as [number, number][]).map(([px, py], i) => {
          const dx = px === fx ? 1 : -1
          const dy = py === fy ? 1 : -1
          return (
            <g key={i}>
              <line className={s.cornerTick} x1={px} y1={py} x2={px + dx * 12} y2={py} />
              <line className={s.cornerTick} x1={px} y1={py} x2={px} y2={py + dy * 12} />
            </g>
          )
        })}

        {/* Face oval */}
        <ellipse className={s.oval} cx={ovalCx} cy={ovalCy} rx={ovalRx} ry={ovalRy} />

        {/* Crown */}
        <line className={cx(s.guideLine, s.strokeYellow)} x1={lineX1} y1={crownY} x2={lineX2} y2={crownY} />
        <text className={cx(s.guideLabel, s.fillYellow)} x={labelX} y={crownY + 6}>crown</text>

        {/* Chin */}
        <line className={cx(s.guideLine, s.strokeYellow)} x1={lineX1} y1={chinY} x2={lineX2} y2={chinY} />
        <text className={cx(s.guideLabel, s.fillYellow)} x={labelX} y={chinY + 6}>chin</text>

        {/* Eyes */}
        <line className={cx(s.guideLine, s.strokeBlue)} x1={lineX1} y1={eyeY} x2={lineX2} y2={eyeY} />
        <text className={cx(s.guideLabel, s.fillBlue)} x={labelX} y={eyeY + 6}>eyes</text>

        {/* Dimension label */}
        <text className={s.dimLabel} x={fx + fw / 2} y={fy + fh + 20} textAnchor="middle">
          face height guide inside
        </text>
      </svg>
    </>
  )
}
