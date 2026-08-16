import type { ImageAdjustments, QuickLook } from './types';
import { QUICK_LOOKS } from './types';

export function adjustmentsToFilter(a: ImageAdjustments): string {
  const parts: string[] = [];
  if (a.brightness !== 100) parts.push(`brightness(${a.brightness}%)`);
  if (a.contrast !== 100) parts.push(`contrast(${a.contrast}%)`);
  if (a.saturation !== 100) parts.push(`saturate(${a.saturation}%)`);
  if (a.blur > 0) parts.push(`blur(${a.blur}px)`);
  return parts.join(' ');
}

export function applyQuickLook(current: ImageAdjustments, look: QuickLook): ImageAdjustments {
  const preset = QUICK_LOOKS.find((l) => l.id === look);
  if (!preset) return current;
  return {
    ...current,
    quickLook: look,
    ...preset.adjustments,
  } as ImageAdjustments;
}

export function resetAdjustments(): ImageAdjustments {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    opacity: 100,
    flipH: false,
    flipV: false,
    rotation: 0,
    quickLook: 'none',
  };
}
