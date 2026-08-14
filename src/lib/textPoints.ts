export interface Point2D {
  x: number;
  y: number;
}

/**
 * Renders `text` to an offscreen 2D canvas and samples the lit pixels into a
 * normalized point cloud (x, y in roughly [-1, 1]). Used to give the hero's
 * particle system a real target shape — the product's own name assembling
 * out of noise — instead of a generic abstract formation.
 *
 * Uses a plain system font (not the site's webfont) so sampling never races
 * an async font load: at this size/density the exact typeface is invisible
 * once it's a few hundred scattered dots.
 */
export function sampleTextPoints(
  text: string,
  {
    width = 1024,
    height = 300,
    fontSize = 220,
    density = 3,
    count = 720,
  }: { width?: number; height?: number; fontSize?: number; density?: number; count?: number } = {}
): Point2D[] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(text, width / 2, height / 2 + fontSize * 0.04);

  const { data } = ctx.getImageData(0, 0, width, height);
  const found: Point2D[] = [];

  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 140) {
        found.push({ x: (x / width - 0.5) * 2, y: -(y / height - 0.5) * 2 });
      }
    }
  }

  // Deterministic-enough shuffle (Fisher-Yates) so the point cloud isn't
  // biased toward scan order, then pad/trim to a stable count so every
  // caller gets exactly `count` points regardless of glyph density.
  for (let i = found.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [found[i], found[j]] = [found[j], found[i]];
  }

  if (found.length === 0) return [];

  const result: Point2D[] = [];
  for (let i = 0; i < count; i++) {
    result.push(found[i % found.length]);
  }
  return result;
}
