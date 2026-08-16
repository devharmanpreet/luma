import { useState, useRef } from 'react';
import { store, useEditor } from './store';
import { createTextElement, createShapeElement, createImageElement } from './elements';
import { PRESET_SIZES, FONTS, uid, type ShapeKind, type DesignDocument, type DesignElement } from './types';
import { Type, Image as ImageIcon, Shapes, Layout, Upload, Square, Circle, Triangle as TriangleIcon, Minus } from 'lucide-react';

type Tab = 'design' | 'elements' | 'text' | 'uploads' | 'templates';

export function LeftPanel() {
  const [tab, setTab] = useState<Tab>('design');
  const editor = useEditor();

  return (
    <div className="w-60 flex flex-col h-full border-r" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
      <div className="flex flex-col gap-1 p-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-5 gap-1">
          <TabBtn icon={<Layout size={16} />} label="Design" active={tab === 'design'} onClick={() => setTab('design')} />
          <TabBtn icon={<Shapes size={16} />} label="Elements" active={tab === 'elements'} onClick={() => setTab('elements')} />
          <TabBtn icon={<Type size={16} />} label="Text" active={tab === 'text'} onClick={() => setTab('text')} />
          <TabBtn icon={<Upload size={16} />} label="Uploads" active={tab === 'uploads'} onClick={() => setTab('uploads')} />
          <TabBtn icon={<ImageIcon size={16} />} label="Templates" active={tab === 'templates'} onClick={() => setTab('templates')} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3" style={{ color: 'var(--text-primary)' }}>
        {tab === 'design' && <DesignTab editor={editor} />}
        {tab === 'elements' && <ElementsTab />}
        {tab === 'text' && <TextTab />}
        {tab === 'uploads' && <UploadsTab />}
        {tab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2 rounded-md text-[10px] font-medium transition-colors"
      style={active ? { background: 'var(--accent-bg)', color: 'var(--accent-text)' } : { color: 'var(--text-muted)' }}
      onMouseEnter={(e) => !active && (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => !active && (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  );
}

function DesignTab({ editor }: { editor: ReturnType<typeof useEditor> }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Canvas Size</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_SIZES.map((size) => (
            <button
              key={size.name}
              onClick={() => {
                if (size.name === 'Custom') {
                  const w = parseInt(prompt('Width (px)?', String(editor.document.canvas.width)) || '0');
                  const h = parseInt(prompt('Height (px)?', String(editor.document.canvas.height)) || '0');
                  if (w > 0 && h > 0) store.newDocument({ width: w, height: h, name: 'Custom' });
                } else {
                  store.newDocument(size);
                }
              }}
              className="p-2 rounded-lg border text-left transition-colors"
              style={editor.document.canvas.name === size.name
                ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' }
                : { borderColor: 'var(--border)' }}
              onMouseEnter={(e) => editor.document.canvas.name !== size.name && (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={(e) => editor.document.canvas.name !== size.name && (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{size.name}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{size.width} × {size.height}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Background</h3>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={editor.document.background}
            onChange={(e) => store.updateDocument((doc) => ({ ...doc, background: e.target.value, backgroundGradient: null }))}
            className="w-8 h-8 rounded cursor-pointer"
            style={{ background: 'transparent', border: '1px solid var(--border)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{editor.document.background}</span>
        </div>
        <div className="mt-3 space-y-2">
          <GradientPicker />
        </div>
      </div>
    </div>
  );
}

function GradientPicker() {
  const editor = useEditor();
  const presets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
  ];
  return (
    <div>
      <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Gradients</div>
      <div className="grid grid-cols-4 gap-2">
        {presets.map((g) => (
          <button
            key={g}
            onClick={() => store.updateDocument((doc) => ({ ...doc, backgroundGradient: g, background: '#ffffff' }))}
            className="h-10 rounded-md border transition-colors hover:opacity-80"
            style={{ background: g, borderColor: 'var(--border)' }}
          />
        ))}
      </div>
      {editor.document.backgroundGradient && (
        <button
          onClick={() => store.updateDocument((doc) => ({ ...doc, backgroundGradient: null }))}
          className="mt-2 text-[10px] hover:opacity-80"
          style={{ color: 'var(--accent-text)' }}
        >
          Remove gradient
        </button>
      )}
    </div>
  );
}

function ElementsTab() {
  const editor = useEditor();
  const shapes: { kind: ShapeKind; icon: React.ReactNode; label: string }[] = [
    { kind: 'rect', icon: <Square size={24} />, label: 'Rectangle' },
    { kind: 'ellipse', icon: <Circle size={24} />, label: 'Circle' },
    { kind: 'triangle', icon: <TriangleIcon size={24} />, label: 'Triangle' },
    { kind: 'line', icon: <Minus size={24} />, label: 'Line' },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Shapes</h3>
        <div className="grid grid-cols-2 gap-2">
          {shapes.map((s) => (
            <button
              key={s.kind}
              onClick={() => {
                const cx = editor.document.canvas.width / 2 - 100;
                const cy = editor.document.canvas.height / 2 - 100;
                store.addElement(createShapeElement(s.kind, cx, cy));
              }}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {s.icon}
              <span className="text-[10px]">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextTab() {
  const editor = useEditor();
  const presets = [
    { label: 'Add a heading', size: 72, weight: 700 },
    { label: 'Add a subheading', size: 48, weight: 600 },
    { label: 'Add body text', size: 28, weight: 400 },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Add Text</h3>
        <div className="space-y-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                const el = createTextElement(
                  editor.document.canvas.width / 2 - 200,
                  editor.document.canvas.height / 2 - 40,
                  p.label
                );
                el.fontSize = p.size;
                el.fontWeight = p.weight;
                store.addElement(el);
              }}
              className="w-full text-left px-3 py-3 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontWeight: p.weight, fontSize: Math.min(p.size / 3, 22) }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Font Combinations</h3>
        <div className="space-y-2">
          {FONTS.slice(0, 6).map((f) => (
            <button
              key={f}
              onClick={() => {
                const el = createTextElement(
                  editor.document.canvas.width / 2 - 200,
                  editor.document.canvas.height / 2 - 40,
                  'Your text here'
                );
                el.fontFamily = f;
                store.addElement(el);
              }}
              className="w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: f }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadsTab() {
  const editor = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('luma:uploads') || '[]');
    } catch {
      return [];
    }
  });

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        setUploads((prev) => {
          const next = [src, ...prev];
          localStorage.setItem('luma:uploads', JSON.stringify(next));
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full py-3 rounded-lg border border-dashed text-sm flex items-center justify-center gap-2 transition-colors"
        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Upload size={16} /> Upload images
      </button>
      {uploads.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {uploads.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                const img = new Image();
                img.onload = () => {
                  const maxW = editor.document.canvas.width * 0.6;
                  const maxH = editor.document.canvas.height * 0.6;
                  let w = img.naturalWidth;
                  let h = img.naturalHeight;
                  const scale = Math.min(maxW / w, maxH / h, 1);
                  w *= scale;
                  h *= scale;
                  const el = createImageElement(
                    src,
                    editor.document.canvas.width / 2 - w / 2,
                    editor.document.canvas.height / 2 - h / 2,
                    w,
                    h
                  );
                  store.addElement(el);
                };
                img.src = src;
              }}
              className="aspect-square rounded-lg overflow-hidden border transition-colors"
              style={{ borderColor: 'var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplatesTab() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Templates</h3>
      <div className="grid grid-cols-1 gap-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.name}
            onClick={() => store.loadDocument(buildTemplate(tpl))}
            className="rounded-lg overflow-hidden border text-left transition-colors"
            style={{ borderColor: 'var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div
              className="aspect-video flex items-center justify-center text-white text-xs font-semibold p-2"
              style={{ background: tpl.bg, width: '100%', height: '100%' }}
            >
              {tpl.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface TemplateDef {
  name: string;
  bg: string;
  build: () => DesignElement[];
}
const TEMPLATES: TemplateDef[] = [
  {
    name: 'Bold Quote',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    build: () => {
      const t = createTextElement(140, 400, '"Design is not just what it looks like and feels like. Design is how it works."');
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
      return [t, s];
    },
  },
];

function buildTemplate(tpl: TemplateDef): DesignDocument {
  return {
    id: uid(),
    name: tpl.name,
    canvas: { width: 1080, height: 1080, name: 'Instagram Post' },
    elements: tpl.build(),
    background: '#ffffff',
    backgroundGradient: tpl.bg,
  };
}
