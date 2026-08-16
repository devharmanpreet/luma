import type {
  DesignElement,
  TextElement,
  ImageElement,
  ShapeElement,
  BackgroundElement,
  ShapeKind,
} from './types';
import { uid, defaultAdjustments } from './types';

export function createTextElement(
  x: number,
  y: number,
  text = 'Add your text here'
): TextElement {
  return {
    id: uid(),
    type: 'text',
    x,
    y,
    width: 400,
    height: 80,
    rotation: 0,
    opacity: 100,
    locked: false,
    hidden: false,
    name: 'Text',
    text,
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: 600,
    fontStyle: 'normal',
    align: 'left',
    color: '#1a1a1a',
    lineHeight: 1.2,
    letterSpacing: 0,
    textDecoration: 'none',
    backgroundColor: 'transparent',
    padding: 8,
  };
}

export function createImageElement(
  src: string,
  x: number,
  y: number,
  width: number,
  height: number
): ImageElement {
  return {
    id: uid(),
    type: 'image',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 100,
    locked: false,
    hidden: false,
    name: 'Image',
    src,
    adjustments: defaultAdjustments(),
    cornerRadius: 0,
  };
}

export function createShapeElement(
  shape: ShapeKind,
  x: number,
  y: number
): ShapeElement {
  return {
    id: uid(),
    type: 'shape',
    x,
    y,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 100,
    locked: false,
    hidden: false,
    name: shape.charAt(0).toUpperCase() + shape.slice(1),
    shape,
    fill: '#6366f1',
    stroke: 'transparent',
    strokeWidth: 0,
    cornerRadius: shape === 'rect' ? 0 : 0,
  };
}

export function createBackgroundElement(): BackgroundElement {
  return {
    id: uid(),
    type: 'background',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 100,
    locked: false,
    hidden: false,
    name: 'Background',
    fill: '#ffffff',
    gradient: null,
  };
}
