export type ElementType = 'text' | 'image' | 'shape' | 'background';

export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'line';

export type QuickLook =
  | 'none'
  | 'cinematic'
  | 'warm'
  | 'clean'
  | 'bw'
  | 'vibrant'
  | 'moody';

export interface ImageAdjustments {
  brightness: number; // 0..200, 100 = normal
  contrast: number; // 0..200
  saturation: number; // 0..200
  blur: number; // 0..20 px
  opacity: number; // 0..100
  flipH: boolean;
  flipV: boolean;
  rotation: number; // degrees, applied in addition to element rotation
  quickLook: QuickLook;
}

export const defaultAdjustments = (): ImageAdjustments => ({
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  opacity: 100,
  flipH: false,
  flipV: false,
  rotation: 0,
  quickLook: 'none',
});

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0..100
  locked: boolean;
  hidden: boolean;
  name: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  align: 'left' | 'center' | 'right';
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: 'none' | 'underline';
  backgroundColor: string;
  padding: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  adjustments: ImageAdjustments;
  cornerRadius: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface BackgroundElement extends BaseElement {
  type: 'background';
  fill: string;
  gradient: string | null;
}

export type DesignElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | BackgroundElement;

export interface CanvasSize {
  width: number;
  height: number;
  name: string;
}

export interface DesignDocument {
  id: string;
  name: string;
  canvas: CanvasSize;
  elements: DesignElement[];
  background: string;
  backgroundGradient: string | null;
}

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: number;
  thumbnail: string;
  document: DesignDocument;
}

export const PRESET_SIZES: CanvasSize[] = [
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'Poster', width: 2480, height: 3508 },
  { name: 'Flyer', width: 1240, height: 1754 },
  { name: 'Presentation', width: 1920, height: 1080 },
  { name: 'Custom', width: 1080, height: 1080 },
];

export const FONTS = [
  'Inter',
  'Georgia',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
];

export const QUICK_LOOKS: { id: QuickLook; name: string; adjustments: Partial<ImageAdjustments> }[] = [
  { id: 'none', name: 'Original', adjustments: {} },
  { id: 'cinematic', name: 'Cinematic', adjustments: { brightness: 92, contrast: 128, saturation: 88, blur: 0 } },
  { id: 'warm', name: 'Warm', adjustments: { brightness: 108, contrast: 106, saturation: 132, blur: 0 } },
  { id: 'clean', name: 'Clean', adjustments: { brightness: 112, contrast: 112, saturation: 96, blur: 0 } },
  { id: 'bw', name: 'B&W', adjustments: { brightness: 104, contrast: 116, saturation: 0, blur: 0 } },
  { id: 'vibrant', name: 'Vibrant', adjustments: { brightness: 104, contrast: 118, saturation: 165, blur: 0 } },
  { id: 'moody', name: 'Moody', adjustments: { brightness: 82, contrast: 134, saturation: 72, blur: 0 } },
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
