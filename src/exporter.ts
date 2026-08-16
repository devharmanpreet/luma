import type { DesignDocument, DesignElement } from './types';
import { adjustmentsToFilter } from './filters';

export type ExportFormat = 'png' | 'jpeg' | 'webp';

export async function exportDocument(
  doc: DesignDocument,
  format: ExportFormat,
  scale = 1
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(doc.canvas.width * scale);
  canvas.height = Math.round(doc.canvas.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.scale(scale, scale);

  // background
  if (doc.backgroundGradient) {
    const grad = parseGradient(doc.backgroundGradient, doc.canvas.width, doc.canvas.height, ctx);
    if (grad) {
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = doc.background;
    }
  } else {
    ctx.fillStyle = doc.background;
  }
  ctx.fillRect(0, 0, doc.canvas.width, doc.canvas.height);

  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    doc.elements
      .filter((e): e is Extract<DesignElement, { type: 'image' }> => e.type === 'image' && !e.hidden)
      .map(async (el) => {
        const img = await loadImage(el.src);
        images.set(el.id, img);
      })
  );

  for (const el of doc.elements) {
    if (el.hidden) continue;
    ctx.save();
    ctx.globalAlpha = el.opacity / 100;

    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-el.width / 2, -el.height / 2);

    if (el.type === 'text') {
      renderText(ctx, el);
    } else if (el.type === 'shape') {
      renderShape(ctx, el);
    } else if (el.type === 'image') {
      const img = images.get(el.id);
      if (img) renderImage(ctx, el, img);
    }
    ctx.restore();
  }

  const mime = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
  const quality = format === 'png' ? undefined : 0.92;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      mime,
      quality
    );
  });
}

function renderText(ctx: CanvasRenderingContext2D, el: Extract<DesignElement, { type: 'text' }>) {
  const fontStyle = el.fontStyle === 'italic' ? 'italic' : 'normal';
  ctx.font = `${fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign = el.align;

  if (el.backgroundColor !== 'transparent') {
    ctx.fillStyle = el.backgroundColor;
    ctx.fillRect(0, 0, el.width, el.height);
  }

  ctx.fillStyle = el.color;
  const lines = wrapText(ctx, el.text, el.width - el.padding * 2);
  const lineHeightPx = el.fontSize * el.lineHeight;
  let y = el.padding;
  const x = el.align === 'left' ? el.padding : el.align === 'center' ? el.width / 2 : el.width - el.padding;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeightPx;
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    result.push(line);
  }
  return result;
}

function renderShape(ctx: CanvasRenderingContext2D, el: Extract<DesignElement, { type: 'shape' }>) {
  ctx.fillStyle = el.fill;
  if (el.strokeWidth > 0) {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth;
  }
  if (el.shape === 'rect') {
    if (el.cornerRadius > 0) {
      roundRect(ctx, 0, 0, el.width, el.height, el.cornerRadius);
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
    } else {
      ctx.fillRect(0, 0, el.width, el.height);
      if (el.strokeWidth > 0) ctx.strokeRect(0, 0, el.width, el.height);
    }
  } else if (el.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(el.width / 2, el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (el.strokeWidth > 0) ctx.stroke();
  } else if (el.shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(el.width / 2, 0);
    ctx.lineTo(el.width, el.height);
    ctx.lineTo(0, el.height);
    ctx.closePath();
    ctx.fill();
    if (el.strokeWidth > 0) ctx.stroke();
  } else if (el.shape === 'line') {
    ctx.strokeStyle = el.fill;
    ctx.lineWidth = Math.max(el.height, 2);
    ctx.beginPath();
    ctx.moveTo(0, el.height / 2);
    ctx.lineTo(el.width, el.height / 2);
    ctx.stroke();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function renderImage(
  ctx: CanvasRenderingContext2D,
  el: Extract<DesignElement, { type: 'image' }>,
  img: HTMLImageElement
) {
  ctx.save();
  const a = el.adjustments;
  ctx.filter = adjustmentsToFilter(a);
  if (a.flipH || a.flipV) {
    ctx.translate(el.width / 2, el.height / 2);
    ctx.scale(a.flipH ? -1 : 1, a.flipV ? -1 : 1);
    ctx.translate(-el.width / 2, -el.height / 2);
  }
  ctx.rotate((a.rotation * Math.PI) / 180);
  if (el.cornerRadius > 0) {
    roundRect(ctx, 0, 0, el.width, el.height, el.cornerRadius);
    ctx.clip();
  }
  ctx.drawImage(img, 0, 0, el.width, el.height);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed: ' + src));
    img.src = src;
  });
}

function parseGradient(
  grad: string,
  w: number,
  h: number,
  ctx: CanvasRenderingContext2D
): CanvasGradient | null {
  try {
    if (grad.startsWith('linear-gradient(')) {
      const inner = grad.slice('linear-gradient('.length, -1);
      const parts = inner.split(',').map((s) => s.trim());
      const anglePart = parts[0];
      let angle = 180;
      let colorParts = parts;
      if (anglePart.includes('deg')) {
        angle = parseFloat(anglePart);
        colorParts = parts.slice(1);
      }
      const rad = ((angle - 90) * Math.PI) / 180;
      const x0 = w / 2 - Math.cos(rad) * (w / 2);
      const y0 = h / 2 - Math.sin(rad) * (h / 2);
      const x1 = w / 2 + Math.cos(rad) * (w / 2);
      const y1 = h / 2 + Math.sin(rad) * (h / 2);
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      colorParts.forEach((c, i) => {
        const m = c.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*(\d+%)?/);
        if (m) g.addColorStop(m[2] ? parseFloat(m[2]) / 100 : i / (colorParts.length - 1), m[1]);
      });
      return g;
    }
    if (grad.startsWith('radial-gradient(')) {
      const inner = grad.slice('radial-gradient('.length, -1);
      const parts = inner.split(',').map((s) => s.trim());
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
      parts.forEach((c, i) => {
        const m = c.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*(\d+%)?/);
        if (m) g.addColorStop(m[2] ? parseFloat(m[2]) / 100 : i / (parts.length - 1), m[1]);
      });
      return g;
    }
  } catch {
    // ignore
  }
  return null;
}
