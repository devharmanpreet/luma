import { useState } from 'react';
import { store } from './store';
import { useTheme, themeStore } from './theme';
import { PRESET_SIZES, uid, type CanvasSize, type DesignElement, type DesignDocument } from './types';
import { createTextElement, createShapeElement } from './elements';
import {
  Sparkles, Sun, Moon, ArrowRight, Type, Image as ImageIcon,
  Shapes, Layout, Wand2, Download, Layers, Undo2,
  Star, Zap, Palette,
} from 'lucide-react';

export function LandingPage({ onOpenEditor }: { onOpenEditor: () => void }) {
  const theme = useTheme();
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);

  const startBlank = (size: CanvasSize) => {
    store.newDocument(size);
    onOpenEditor();
  };

  const startCustom = () => {
    if (customW > 0 && customH > 0) {
      store.newDocument({ width: customW, height: customH, name: 'Custom' });
      onOpenEditor();
    }
  };

  const startTemplate = (tpl: () => DesignElement[], bg: string, name: string) => {
    const doc: DesignDocument = {
      id: uid(),
      name,
      canvas: { width: 1080, height: 1080, name: 'Instagram Post' },
      elements: tpl(),
      background: '#ffffff',
      backgroundGradient: bg,
    };
    store.loadDocument(doc);
    onOpenEditor();
  };

  return (
    <div className="min-h-screen w-screen overflow-y-auto" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg-app) 85%, transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Luma</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => themeStore.toggle()}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-hover)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onOpenEditor}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'var(--accent)' }}
          >
            Open Editor
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 animate-fade-in" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
          <Wand2 size={14} />
          <span className="text-xs font-semibold">Quick Looks — one-click professional image styling</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
          Design like Canva.<br />Style like Luma.
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ color: 'var(--text-secondary)', animationDelay: '0.15s', opacity: 0 }}>
          Create stunning designs with an easy drag-and-drop editor, then give every image a
          professional finish with one-click Quick Looks.
        </p>
        <div className="flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
          <button
            onClick={() => startBlank(PRESET_SIZES[0])}
            className="px-6 py-3 rounded-xl text-white font-semibold text-base flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
            style={{ background: 'var(--accent)' }}
          >
            Create a design <ArrowRight size={18} />
          </button>
          <button
            onClick={onOpenEditor}
            className="px-6 py-3 rounded-xl font-semibold text-base transition-all hover:scale-105"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          >
            Open Editor
          </button>
        </div>
      </section>

      {/* Quick start sizes */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Start with a blank canvas</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Pick a format and start designing.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESET_SIZES.filter((s) => s.name !== 'Custom').map((size, i) => (
            <button
              key={size.name}
              onClick={() => startBlank(size)}
              className="group rounded-xl border p-4 text-left transition-all hover:scale-105 animate-fade-in-up"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)', animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              <div className="flex items-center justify-center mb-3 rounded-lg" style={{ background: 'var(--bg-canvas-area)', height: '60px' }}>
                <div
                  className="rounded border-2 group-hover:border-indigo-500 transition-colors"
                  style={{
                    borderColor: 'var(--border-strong)',
                    width: size.width > size.height ? '40px' : `${40 * (size.width / size.height)}px`,
                    height: size.height > size.width ? '40px' : `${40 * (size.height / size.width)}px`,
                  }}
                />
              </div>
              <div className="text-sm font-semibold">{size.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{size.width} × {size.height}</div>
            </button>
          ))}
        </div>

        {/* Custom size */}
        <div className="mt-4 rounded-xl border p-4 flex flex-wrap items-end gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Custom width (px)</label>
            <input type="number" value={customW} onChange={(e) => setCustomW(parseInt(e.target.value) || 0)}
              className="w-28 px-3 py-2 rounded-lg border text-sm themed-input" />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Custom height (px)</label>
            <input type="number" value={customH} onChange={(e) => setCustomH(parseInt(e.target.value) || 0)}
              className="w-28 px-3 py-2 rounded-lg border text-sm themed-input" />
          </div>
          <button onClick={startCustom}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'var(--accent)' }}>
            Create custom
          </button>
        </div>
      </section>

      {/* Templates */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Start from a template</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Fully editable designs — click to open in the editor.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LANDING_TEMPLATES.map((tpl, i) => (
            <button
              key={tpl.name}
              onClick={() => startTemplate(tpl.build, tpl.bg, tpl.name)}
              className="group rounded-xl overflow-hidden border transition-all hover:scale-105 animate-fade-in-up"
              style={{ borderColor: 'var(--border)', animationDelay: `${i * 0.08}s`, opacity: 0 }}
            >
              <div className="aspect-square flex items-center justify-center p-4 relative" style={{ background: tpl.bg }}>
                <TemplatePreview build={tpl.build} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--overlay)' }}>
                  <span className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--accent)' }}>Use template</span>
                </div>
              </div>
              <div className="p-3 text-left">
                <div className="text-sm font-semibold">{tpl.name}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-center">Everything you need to design</h2>
        <p className="text-center mb-10" style={{ color: 'var(--text-secondary)' }}>Professional tools in a simple, Canva-style editor.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="rounded-xl border p-6 animate-fade-in-up" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)', animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-bg)' }}>
                <f.icon size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto rounded-2xl p-10 animate-pulse-glow" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <h2 className="text-3xl font-bold mb-3">Ready to create?</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Open the editor and start designing in seconds.</p>
          <button
            onClick={onOpenEditor}
            className="px-8 py-3 rounded-xl text-white font-semibold text-lg flex items-center gap-2 mx-auto transition-all hover:scale-105"
            style={{ background: 'var(--accent)' }}
          >
            Open Editor <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="font-bold">Luma</span>
        </div>
        Design like Canva. Style like Luma.
      </footer>
    </div>
  );
}

function TemplatePreview({ build }: { build: () => DesignElement[] }) {
  const els = build();
  return (
    <div className="relative w-full h-full" style={{ transform: 'scale(0.35)', transformOrigin: 'center' }}>
      {els.map((el, i) => {
        if (el.type === 'text') {
          return (
            <div key={i} className="absolute whitespace-pre-wrap" style={{
              left: el.x, top: el.y, width: el.width,
              fontSize: el.fontSize, fontWeight: el.fontWeight,
              color: el.color, textAlign: el.align, fontFamily: el.fontFamily,
              lineHeight: el.lineHeight, fontStyle: el.fontStyle,
            }}>
              {el.text}
            </div>
          );
        }
        if (el.type === 'shape') {
          return (
            <div key={i} className="absolute" style={{
              left: el.x, top: el.y, width: el.width, height: el.height,
              background: (el as Extract<DesignElement, { type: 'shape' }>).fill,
              borderRadius: (el as Extract<DesignElement, { type: 'shape' }>).cornerRadius,
            }} />
          );
        }
        return null;
      })}
    </div>
  );
}

const FEATURES = [
  { icon: Type, title: 'Text & Typography', desc: 'Add headings, subheadings, and body text with full font, weight, color, and alignment controls.' },
  { icon: ImageIcon, title: 'Image Editing', desc: 'Upload multiple images, adjust brightness, contrast, saturation, blur, flip, and rotate — each independently.' },
  { icon: Wand2, title: 'Quick Looks', desc: 'One-click professional presets: Cinematic, Warm, Clean, B&W, Vibrant, and Moody — no Photoshop needed.' },
  { icon: Shapes, title: 'Shapes & Elements', desc: 'Rectangles, circles, triangles, and lines with fill, stroke, corner radius, and opacity controls.' },
  { icon: Layers, title: 'Layers & Arrange', desc: 'Full layer panel with reordering, lock, hide, duplicate, and multi-select support.' },
  { icon: Download, title: 'Export Anywhere', desc: 'Export your design as PNG, JPG, or WebP at 1x, 2x, or 3x resolution with correct canvas dimensions.' },
];

const LANDING_TEMPLATES: { name: string; bg: string; build: () => DesignElement[] }[] = [
  {
    name: 'Bold Quote',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    build: () => {
      const t = createTextElement(140, 400, '"Design is not just what it looks like. Design is how it works."');
      t.fontSize = 56; t.fontWeight = 700; t.color = '#ffffff'; t.width = 800; t.height = 200; t.align = 'center';
      const a = createTextElement(140, 620, '— Steve Jobs');
      a.fontSize = 36; a.fontWeight = 400; a.color = '#ffffffcc'; a.width = 800; a.align = 'center';
      return [t, a];
    },
  },
  {
    name: 'Sale Promo',
    bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    build: () => {
      const t = createTextElement(140, 300, 'BIG SALE');
      t.fontSize = 120; t.fontWeight = 800; t.color = '#ffffff'; t.width = 800; t.align = 'center';
      const s = createTextElement(140, 460, 'Up to 50% Off');
      s.fontSize = 48; s.fontWeight = 600; s.color = '#ffffff'; s.width = 800; s.align = 'center';
      return [t, s];
    },
  },
  {
    name: 'Minimal Title',
    bg: '#ffffff',
    build: () => {
      const t = createTextElement(140, 460, 'LUMA');
      t.fontSize = 100; t.fontWeight = 800; t.color = '#1a1a1a'; t.width = 800; t.align = 'center';
      const s = createTextElement(140, 580, 'Design beautifully.');
      s.fontSize = 32; s.fontWeight = 400; s.color = '#666'; s.width = 800; s.align = 'center';
      return [t, s];
    },
  },
  {
    name: 'Event Poster',
    bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    build: () => {
      const t = createTextElement(140, 200, 'MUSIC\nFESTIVAL');
      t.fontSize = 90; t.fontWeight = 800; t.color = '#ffffff'; t.width = 800; t.height = 250; t.align = 'center'; t.lineHeight = 1.1;
      const s = createTextElement(140, 800, 'August 16, 2026');
      s.fontSize = 40; s.fontWeight = 500; s.color = '#ffffffaa'; s.width = 800; s.align = 'center';
      const shape = createShapeElement('ellipse', 340, 60);
      shape.width = 400; shape.height = 120; shape.fill = '#ffffff20'; shape.cornerRadius = 60;
      return [shape, t, s];
    },
  },
];
