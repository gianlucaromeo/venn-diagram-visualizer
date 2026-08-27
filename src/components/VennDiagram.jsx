import { useId } from 'react';
import { REGION_COUNT, SET_COUNT, hasRegion } from '../core/index.js';
import './VennDiagram.css';

/**
 * Three-circle Venn diagram renderer.
 *
 * Deliberately dumb: it receives a region bitmask and flips one attribute
 * per region. All set arithmetic happens in the core.
 *
 * Each of the 8 regions is a full-canvas rect carved down by SVG geometry:
 * nested clipPaths intersect it with every circle the region is inside,
 * and a mask (white rect with black circles punched out) subtracts every
 * circle the region is outside.
 */

const WIDTH = 380;
const HEIGHT = 320;
const RADIUS = 80;
const CIRCLES = [
  { name: 'A', cx: 150, cy: 118, labelX: 88, labelY: 52 },
  { name: 'B', cx: 230, cy: 118, labelX: 292, labelY: 52 },
  { name: 'C', cx: 190, cy: 188, labelX: 190, labelY: 292 },
];

export default function VennDiagram({ mask, onRegionClick }) {
  const uid = useId();
  const clipId = (i) => `${uid}-clip-${i}`;
  const maskId = (r) => `${uid}-mask-${r}`;

  const regions = [];
  for (let r = 0; r < REGION_COUNT; r++) {
    const inside = [];
    const outside = [];
    for (let i = 0; i < SET_COUNT; i++) {
      ((r >> i) & 1 ? inside : outside).push(i);
    }

    let shape = (
      <rect
        width={WIDTH}
        height={HEIGHT}
        className={`venn-region${hasRegion(mask, r) ? ' venn-region--on' : ''}`}
        mask={outside.length > 0 ? `url(#${maskId(r)})` : undefined}
        data-region={r}
        onClick={onRegionClick ? () => onRegionClick(r) : undefined}
      />
    );
    // Nesting one clip per group intersects; multiple shapes inside a
    // single clipPath would union instead.
    for (const i of inside) {
      shape = <g clipPath={`url(#${clipId(i)})`}>{shape}</g>;
    }
    regions.push(
      <g key={r}>
        {outside.length > 0 && (
          <mask id={maskId(r)}>
            <rect width={WIDTH} height={HEIGHT} fill="white" />
            {outside.map((i) => (
              <circle key={i} cx={CIRCLES[i].cx} cy={CIRCLES[i].cy} r={RADIUS} fill="black" />
            ))}
          </mask>
        )}
        {shape}
      </g>,
    );
  }

  return (
    <svg
      className="venn-diagram"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Venn diagram of sets A, B, and C"
    >
      <defs>
        {CIRCLES.map((c, i) => (
          <clipPath key={i} id={clipId(i)}>
            <circle cx={c.cx} cy={c.cy} r={RADIUS} />
          </clipPath>
        ))}
      </defs>
      <rect width={WIDTH} height={HEIGHT} className="venn-frame" />
      {regions}
      {/* Outlines and labels last so shading never covers them. */}
      {CIRCLES.map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r={RADIUS} className="venn-outline" />
          <text x={c.labelX} y={c.labelY} className="venn-label">
            {c.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
