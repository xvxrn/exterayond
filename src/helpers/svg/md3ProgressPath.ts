/** M3CircularProgress: wavelength 15 and amplitude 1.6 in the indicator's drawing units. */
export default function md3ProgressPath(cx: number, cy: number, radius: number) {
  const waves = Math.round(2 * Math.PI * radius / 15);
  const points = waves * 24;
  const path: string[] = [];
  for(let i = 0; i <= points; ++i) {
    const angle = i / points * Math.PI * 2 - Math.PI / 2;
    const r = radius + 1.6 * Math.sin(i / points * Math.PI * 2 * waves);
    const x = Math.round((cx + r * Math.cos(angle)) * 100) / 100;
    const y = Math.round((cy + r * Math.sin(angle)) * 100) / 100;
    path.push(`${i ? 'L' : 'M'}${x} ${y}`);
  }
  return path.join('') + 'Z';
}
