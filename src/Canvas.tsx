import { useRef, useCallback, useEffect, useState } from 'react';
import { store, useEditor } from './store';
import type { DesignElement, ImageAdjustments } from './types';
import { adjustmentsToFilter } from './filters';

interface DragState {
  mode: 'move' | 'resize' | 'rotate';
  handle?: string;
  startX: number;
  startY: number;
  startElements: Record<string, { x: number; y: number; width: number; height: number; rotation: number }>;
  rotationStart?: number;
}

export function Canvas() {
  const editor = useEditor();
  const { document: doc, selectedIds, zoom, panX, panY } = editor;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const canvasW = doc.canvas.width * zoom;
  const canvasH = doc.canvas.height * zoom;

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (sx - rect.left - panX) / zoom,
        y: (sy - rect.top - panY) / zoom,
      };
    },
    [zoom, panX, panY]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
        e.preventDefault();
        return;
      }
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg === 'true') {
        store.select([]);
      }
    },
    [panX, panY]
  );

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      store.setPan(
        panStart.current.panX + (e.clientX - panStart.current.x),
        panStart.current.panY + (e.clientY - panStart.current.y)
      );
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        store.setZoom(zoom * (1 + delta));
      }
    },
    [zoom]
  );

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onWheel={onWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'default', background: 'var(--bg-canvas-area)' }}
    >
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
        }}
      >
        <div
          className="relative"
          style={{
            width: canvasW,
            height: canvasH,
            background: doc.backgroundGradient || doc.background,
            boxShadow: 'var(--canvas-shadow)',
            outline: '1px solid var(--border)',
          }}
          data-bg="true"
        >
          {doc.elements
            .filter((e) => !e.hidden)
            .map((el) => (
              <ElementView key={el.id} el={el} zoom={zoom} selected={selectedIds.includes(el.id)} />
            ))}
          {/* Selection overlays */}
          {selectedIds.map((id) => {
            const el = doc.elements.find((e) => e.id === id);
            if (!el) return null;
            return (
              <SelectionOverlay
                key={`sel-${id}`}
                el={el}
                zoom={zoom}
                onStartDrag={(mode, handle, e) => {
                  dragRef.current = {
                    mode,
                    handle,
                    startX: e.clientX,
                    startY: e.clientY,
                    startElements: {
                      [el.id]: {
                        x: el.x,
                        y: el.y,
                        width: el.width,
                        height: el.height,
                        rotation: el.rotation,
                      },
                    },
                  };
                }}
              />
            );
          })}
        </div>
      </div>
      <DragHandler dragRef={dragRef} screenToCanvas={screenToCanvas} />
    </div>
  );
}

function ElementView({
  el,
  zoom,
  selected,
}: {
  el: DesignElement;
  zoom: number;
  selected: boolean;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x * zoom,
    top: el.y * zoom,
    width: el.width * zoom,
    height: el.height * zoom,
    transform: `rotate(${el.rotation}deg)`,
    transformOrigin: 'center center',
    opacity: el.opacity / 100,
    cursor: el.locked ? 'default' : 'move',
    outline: selected ? 'none' : 'none',
  };

  if (el.type === 'text') {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
          padding: el.padding,
          background: el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined,
          borderRadius: 2,
        }}
        onMouseDown={(e) => {
          if (el.locked) return;
          e.stopPropagation();
          store.select([el.id]);
          const startX = e.clientX;
          const startY = e.clientY;
          const ox = el.x;
          const oy = el.y;
          const onMove = (ev: MouseEvent) => {
            const dx = (ev.clientX - startX) / zoom;
            const dy = (ev.clientY - startY) / zoom;
            store.updateElement(el.id, { x: ox + dx, y: oy + dy }, false);
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            store.updateElement(el.id, {}, true);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <span
          style={{
            fontFamily: el.fontFamily,
            fontSize: el.fontSize * zoom,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            color: el.color,
            lineHeight: el.lineHeight,
            letterSpacing: el.letterSpacing * zoom,
            textDecoration: el.textDecoration,
            textAlign: el.align,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            width: '100%',
            pointerEvents: 'none',
          }}
        >
          {el.text || ' '}
        </span>
      </div>
    );
  }

  if (el.type === 'image') {
    return (
      <div
        style={{
          ...style,
          borderRadius: el.cornerRadius,
          overflow: 'hidden',
        }}
        onMouseDown={(e) => {
          if (el.locked) return;
          e.stopPropagation();
          store.select([el.id]);
          const startX = e.clientX;
          const startY = e.clientY;
          const ox = el.x;
          const oy = el.y;
          const onMove = (ev: MouseEvent) => {
            const dx = (ev.clientX - startX) / zoom;
            const dy = (ev.clientY - startY) / zoom;
            store.updateElement(el.id, { x: ox + dx, y: oy + dy }, false);
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            store.updateElement(el.id, {}, true);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <img
          src={el.src}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: adjustmentsToFilter(el.adjustments as ImageAdjustments),
            transform: `${el.adjustments.flipH ? 'scaleX(-1)' : ''} ${el.adjustments.flipV ? 'scaleY(-1)' : ''} rotate(${el.adjustments.rotation}deg)`,
          }}
        />
      </div>
    );
  }

  if (el.type === 'shape') {
    return (
      <div
        style={{ ...style }}
        onMouseDown={(e) => {
          if (el.locked) return;
          e.stopPropagation();
          store.select([el.id]);
          const startX = e.clientX;
          const startY = e.clientY;
          const ox = el.x;
          const oy = el.y;
          const onMove = (ev: MouseEvent) => {
            const dx = (ev.clientX - startX) / zoom;
            const dy = (ev.clientY - startY) / zoom;
            store.updateElement(el.id, { x: ox + dx, y: oy + dy }, false);
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            store.updateElement(el.id, {}, true);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <ShapeSVG el={el} />
      </div>
    );
  }

  return null;
}

function ShapeSVG({ el }: { el: Extract<DesignElement, { type: 'shape' }> }) {
  const { shape, fill, stroke, strokeWidth, width, height, cornerRadius } = el;
  if (shape === 'rect') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={cornerRadius}
          fill={fill}
          stroke={strokeWidth > 0 ? stroke : 'none'}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }
  if (shape === 'ellipse') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - strokeWidth / 2}
          ry={height / 2 - strokeWidth / 2}
          fill={fill}
          stroke={strokeWidth > 0 ? stroke : 'none'}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polygon
          points={`${width / 2},${strokeWidth / 2} ${width - strokeWidth / 2},${height - strokeWidth / 2} ${strokeWidth / 2},${height - strokeWidth / 2}`}
          fill={fill}
          stroke={strokeWidth > 0 ? stroke : 'none'}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }
  if (shape === 'line') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={fill}
          strokeWidth={Math.max(height, 2)}
        />
      </svg>
    );
  }
  return null;
}

const HANDLE_SIZE = 10;
const HANDLES = ['tl', 'tr', 'bl', 'br', 't', 'r', 'b', 'l'];

function SelectionOverlay({
  el,
  zoom,
  onStartDrag,
}: {
  el: DesignElement;
  zoom: number;
  onStartDrag: (mode: 'resize' | 'rotate', handle: string, e: React.MouseEvent) => void;
}) {
  const w = el.width * zoom;
  const h = el.height * zoom;
  const cx = el.x * zoom + w / 2;
  const cy = el.y * zoom + h / 2;

  const handlePositions: Record<string, { x: number; y: number; cursor: string }> = {
    tl: { x: 0, y: 0, cursor: 'nwse-resize' },
    tr: { x: w, y: 0, cursor: 'nesw-resize' },
    bl: { x: 0, y: h, cursor: 'nesw-resize' },
    br: { x: w, y: h, cursor: 'nwse-resize' },
    t: { x: w / 2, y: 0, cursor: 'ns-resize' },
    r: { x: w, y: h / 2, cursor: 'ew-resize' },
    b: { x: w / 2, y: h, cursor: 'ns-resize' },
    l: { x: 0, y: h / 2, cursor: 'ew-resize' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: el.x * zoom,
        top: el.y * zoom,
        width: w,
        height: h,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid #6366f1',
          pointerEvents: 'none',
        }}
      />
      {/* Rotate handle */}
      <div
        style={{
          position: 'absolute',
          left: w / 2 - 6,
          top: -28,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#6366f1',
          border: '2px solid white',
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartDrag('rotate', 'rotate', e);
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: w / 2,
          top: -16,
          width: 1,
          height: 16,
          background: '#6366f1',
          pointerEvents: 'none',
        }}
      />
      {HANDLES.map((h) => {
        const pos = handlePositions[h];
        return (
          <div
            key={h}
            style={{
              position: 'absolute',
              left: pos.x - HANDLE_SIZE / 2,
              top: pos.y - HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: 'white',
              border: '2px solid #6366f1',
              borderRadius: 2,
              cursor: pos.cursor,
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartDrag('resize', h, e);
            }}
          />
        );
      })}
    </div>
  );
}

function DragHandler({
  dragRef,
  screenToCanvas,
}: {
  dragRef: React.MutableRefObject<DragState | null>;
  screenToCanvas: (sx: number, sy: number) => { x: number; y: number };
}) {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const editor = store.getState();
      const selectedId = editor.selectedIds[0];
      if (!selectedId) return;
      const el = editor.document.elements.find((e2) => e2.id === selectedId);
      if (!el) return;
      const start = drag.startElements[selectedId];

      if (drag.mode === 'resize') {
        const dx = (e.clientX - drag.startX) / editor.zoom;
        const dy = (e.clientY - drag.startY) / editor.zoom;
        const handle = drag.handle!;
        let { x, y, width, height } = start;

        // For simplicity, handle resize without rotation compensation
        if (handle.includes('r')) width = Math.max(10, start.width + dx);
        if (handle.includes('l')) {
          width = Math.max(10, start.width - dx);
          x = start.x + (start.width - width);
        }
        if (handle.includes('b')) height = Math.max(10, start.height + dy);
        if (handle.includes('t')) {
          height = Math.max(10, start.height - dy);
          y = start.y + (start.height - height);
        }
        store.updateElement(selectedId, { x, y, width, height }, false);
      } else if (drag.mode === 'rotate') {
        const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.();
        void rect;
        const cx = start.x + start.width / 2;
        const cy = start.y + start.height / 2;
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const angle = Math.atan2(canvasPos.y - cy, canvasPos.x - cx) * (180 / Math.PI) + 90;
        const snapped = e.shiftKey ? Math.round(angle / 15) * 15 : angle;
        store.updateElement(selectedId, { rotation: snapped }, false);
      }
    };
    const onUp = () => {
      const drag = dragRef.current;
      if (drag) {
        // commit to history
        const editor = store.getState();
        const selectedId = editor.selectedIds[0];
        if (selectedId) store.updateElement(selectedId, {}, true);
      }
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragRef, screenToCanvas]);

  return null;
}
