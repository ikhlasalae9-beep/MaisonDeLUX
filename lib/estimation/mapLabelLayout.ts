import { Bounds, GeoPoint } from './geographicCoverage';

export interface LabelCandidate {
  id: string;
  text: string;
  point: GeoPoint;
  bounds: Bounds;
  priority: number;
  active: boolean;
  hovered?: boolean;
  selected?: boolean;
  allowTwoLines?: boolean;
}

export interface ScreenTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface LabelLayout extends LabelCandidate {
  x: number;
  y: number;
  fontSize: number;
  lines: string[];
  width: number;
  height: number;
}

export function fitBoundsToViewport(
  bounds: Bounds,
  viewportWidth: number,
  viewportHeight: number,
  paddingPx: number,
  maxScale = 6
): Bounds {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const usableWidth = Math.max(1, viewportWidth - paddingPx * 2);
  const usableHeight = Math.max(1, viewportHeight - paddingPx * 2);
  const scale = Math.min(maxScale, usableWidth / width, usableHeight / height);
  const fittedWidth = viewportWidth / scale;
  const fittedHeight = viewportHeight / scale;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    minX: centerX - fittedWidth / 2,
    maxX: centerX + fittedWidth / 2,
    minY: centerY - fittedHeight / 2,
    maxY: centerY + fittedHeight / 2,
  };
}

export function getScreenTransform(
  viewBox: Bounds,
  viewportWidth: number,
  viewportHeight: number
): ScreenTransform {
  const viewWidth = Math.max(1, viewBox.maxX - viewBox.minX);
  const viewHeight = Math.max(1, viewBox.maxY - viewBox.minY);
  const scale = Math.min(viewportWidth / viewWidth, viewportHeight / viewHeight);
  return {
    scale,
    offsetX: (viewportWidth - viewWidth * scale) / 2 - viewBox.minX * scale,
    offsetY: (viewportHeight - viewHeight * scale) / 2 - viewBox.minY * scale,
  };
}

function splitRegionLabel(text: string): string[] {
  const words = text.split(/(?<=-)|\s+/).filter(Boolean);
  if (words.length < 2) return [text];
  let best = 1;
  let difference = Infinity;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ').replace(/-\s/g, '-');
    const right = words.slice(i).join(' ').replace(/-\s/g, '-');
    const nextDifference = Math.abs(left.length - right.length);
    if (nextDifference < difference) {
      difference = nextDifference;
      best = i;
    }
  }
  return [
    words.slice(0, best).join(' ').replace(/-\s/g, '-'),
    words.slice(best).join(' ').replace(/-\s/g, '-'),
  ];
}

function estimatedWidth(lines: string[], fontSize: number, isRTL: boolean): number {
  // Arabic glyphs are generally wider at the same CSS size than Latin map labels.
  const glyphFactor = isRTL ? 0.64 : 0.57;
  return Math.max(...lines.map((line) => Array.from(line).length * fontSize * glyphFactor));
}

function overlaps(a: LabelLayout, b: LabelLayout): boolean {
  const gap = 3;
  return !(
    a.x + a.width / 2 + gap <= b.x - b.width / 2 ||
    a.x - a.width / 2 >= b.x + b.width / 2 + gap ||
    a.y + a.height / 2 + gap <= b.y - b.height / 2 ||
    a.y - a.height / 2 >= b.y + b.height / 2 + gap
  );
}

export function computeLabelLayout(
  candidates: LabelCandidate[],
  transform: ScreenTransform,
  viewportWidth: number,
  isRegionMode: boolean,
  isRTL: boolean
): LabelLayout[] {
  const mobile = viewportWidth < 640;
  const minFont = 10;
  const maxFont = mobile ? 13 : isRegionMode ? 15 : 14;
  const accepted: LabelLayout[] = [];

  const ordered = [...candidates].sort(
    (a, b) => Number(!!b.selected) - Number(!!a.selected) ||
      Number(!!b.hovered) - Number(!!a.hovered) ||
      b.priority - a.priority ||
      a.text.length - b.text.length
  );

  for (const candidate of ordered) {
    const polygonWidth = (candidate.bounds.maxX - candidate.bounds.minX) * transform.scale;
    const polygonHeight = (candidate.bounds.maxY - candidate.bounds.minY) * transform.scale;
    const areaFactor = Math.sqrt(Math.max(1, polygonWidth * polygonHeight)) / 8;
    const lengthPenalty = Math.max(0, Array.from(candidate.text).length - 8) * 0.16;
    let fontSize = Math.min(maxFont, Math.max(minFont, areaFactor - lengthPenalty));
    let lines = [candidate.text];
    const availableWidth = Math.max(0, polygonWidth * 0.82);

    if (estimatedWidth(lines, fontSize, isRTL) > availableWidth && candidate.allowTwoLines) {
      lines = splitRegionLabel(candidate.text);
    }
    while (fontSize > minFont && estimatedWidth(lines, fontSize, isRTL) > availableWidth) {
      fontSize -= 0.5;
    }

    let layout: LabelLayout = {
      ...candidate,
      x: candidate.point.x * transform.scale + transform.offsetX,
      y: candidate.point.y * transform.scale + transform.offsetY,
      fontSize,
      lines,
      width: estimatedWidth(lines, fontSize, isRTL),
      height: lines.length * fontSize * 1.08,
    };

    const fits = layout.width <= availableWidth && layout.height <= polygonHeight * 0.72;
    if (!fits && !candidate.hovered && !candidate.selected) continue;

    while (layout.fontSize > minFont && accepted.some((other) => overlaps(layout, other))) {
      const nextSize = layout.fontSize - 0.5;
      layout = {
        ...layout,
        fontSize: nextSize,
        width: estimatedWidth(layout.lines, nextSize, isRTL),
        height: layout.lines.length * nextSize * 1.08,
      };
    }
    if (accepted.some((other) => overlaps(layout, other))) continue;
    accepted.push(layout);
  }

  return accepted;
}
