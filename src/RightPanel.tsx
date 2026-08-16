import { store, useEditor } from './store';
import type { DesignElement, ImageElement, TextElement, ShapeElement, ImageAdjustments } from './types';
import { QUICK_LOOKS, FONTS } from './types';
import { applyQuickLook, resetAdjustments } from './filters';
import {
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  FlipHorizontal, FlipVertical, RotateCw, Sun, Contrast, Droplet, Circle,
  Layers as LayersIcon,
} from 'lucide-react';

export function RightPanel() {
  const editor = useEditor();
  const selected = editor.document.elements.filter((e) => editor.selectedIds.includes(e.id));
  const single = selected.length === 1 ? selected[0] : null;

  return (
    <div className="w-64 bg-[#26262e] border-l border-black/30 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {single ? (
          <PropertiesPanel el={single} />
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            {selected.length === 0
              ? 'Select an element to edit its properties'
              : `${selected.length} elements selected`}
          </div>
        )}
      </div>
      <LayersPanel />
    </div>
  );
}

function PropertiesPanel({ el }: { el: DesignElement }) {
  return (
    <div className="p-3 space-y-4 text-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">{el.type} Properties</h3>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => store.updateElement(el.id, { locked: !el.locked })} title={el.locked ? 'Unlock' : 'Lock'}>
            {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </IconBtn>
          <IconBtn onClick={() => store.updateElement(el.id, { hidden: !el.hidden })} title={el.hidden ? 'Show' : 'Hide'}>
            {el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </IconBtn>
          <IconBtn onClick={() => store.duplicateElement(el.id)} title="Duplicate">
            <Copy size={14} />
          </IconBtn>
          <IconBtn onClick={() => store.deleteElements([el.id])} title="Delete">
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      {/* Position & Size */}
      <Section title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={Math.round(el.x)} onChange={(v) => store.updateElement(el.id, { x: v })} />
          <NumberField label="Y" value={Math.round(el.y)} onChange={(v) => store.updateElement(el.id, { y: v })} />
          <NumberField label="W" value={Math.round(el.width)} onChange={(v) => store.updateElement(el.id, { width: Math.max(10, v) })} />
          <NumberField label="H" value={Math.round(el.height)} onChange={(v) => store.updateElement(el.id, { height: Math.max(10, v) })} />
        </div>
        <div className="mt-2">
          <SliderField label="Rotation" value={el.rotation} min={-180} max={180} onChange={(v) => store.updateElement(el.id, { rotation: v }, false)} />
        </div>
        <div className="mt-2">
          <SliderField label="Opacity" value={el.opacity} min={0} max={100} suffix="%" onChange={(v) => store.updateElement(el.id, { opacity: v }, false)} />
        </div>
      </Section>

      {el.type === 'text' && <TextProperties el={el} />}
      {el.type === 'image' && <ImageProperties el={el} />}
      {el.type === 'shape' && <ShapeProperties el={el} />}

      {/* Arrange */}
      <Section title="Arrange">
        <div className="grid grid-cols-4 gap-1">
          <IconBtn onClick={() => store.reorderElement(el.id, 'front')} title="Bring to front"><ChevronUp size={14} /><ChevronUp size={14} className="-mt-2" /></IconBtn>
          <IconBtn onClick={() => store.reorderElement(el.id, 'forward')} title="Forward"><ChevronUp size={14} /></IconBtn>
          <IconBtn onClick={() => store.reorderElement(el.id, 'backward')} title="Backward"><ChevronDown size={14} /></IconBtn>
          <IconBtn onClick={() => store.reorderElement(el.id, 'back')} title="Send to back"><ChevronDown size={14} /><ChevronDown size={14} className="-mt-2" /></IconBtn>
        </div>
      </Section>
    </div>
  );
}

function TextProperties({ el }: { el: TextElement }) {
  return (
    <Section title="Text">
      <textarea
        value={el.text}
        onChange={(e) => store.updateElement(el.id, { text: e.target.value }, false)}
        onBlur={() => store.updateElement(el.id, {}, true)}
        className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-sm text-gray-200 resize-none focus:outline-none focus:border-indigo-500"
        rows={3}
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="text-[10px] text-gray-500">Font</label>
          <select
            value={el.fontFamily}
            onChange={(e) => store.updateElement(el.id, { fontFamily: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1 text-xs text-gray-200"
          >
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <NumberField label="Size" value={el.fontSize} onChange={(v) => store.updateElement(el.id, { fontSize: Math.max(1, v) })} />
      </div>
      <div className="flex items-center gap-1 mt-2">
        <IconBtn active={el.fontWeight >= 700} onClick={() => store.updateElement(el.id, { fontWeight: el.fontWeight >= 700 ? 400 : 700 })}><Bold size={14} /></IconBtn>
        <IconBtn active={el.fontStyle === 'italic'} onClick={() => store.updateElement(el.id, { fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={14} /></IconBtn>
        <IconBtn active={el.textDecoration === 'underline'} onClick={() => store.updateElement(el.id, { textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' })}><Underline size={14} /></IconBtn>
        <div className="flex-1" />
        <IconBtn active={el.align === 'left'} onClick={() => store.updateElement(el.id, { align: 'left' })}><AlignLeft size={14} /></IconBtn>
        <IconBtn active={el.align === 'center'} onClick={() => store.updateElement(el.id, { align: 'center' })}><AlignCenter size={14} /></IconBtn>
        <IconBtn active={el.align === 'right'} onClick={() => store.updateElement(el.id, { align: 'right' })}><AlignRight size={14} /></IconBtn>
      </div>
      <div className="mt-2">
        <label className="text-[10px] text-gray-500">Color</label>
        <ColorRow value={el.color} onChange={(c) => store.updateElement(el.id, { color: c })} />
      </div>
      <div className="mt-2">
        <label className="text-[10px] text-gray-500">Background</label>
        <ColorRow value={el.backgroundColor === 'transparent' ? '#ffffff' : el.backgroundColor} onChange={(c) => store.updateElement(el.id, { backgroundColor: c })} />
        <button onClick={() => store.updateElement(el.id, { backgroundColor: 'transparent' })} className="text-[10px] text-indigo-400 mt-1">Transparent</button>
      </div>
      <div className="mt-2">
        <SliderField label="Line Height" value={el.lineHeight} min={0.8} max={3} step={0.1} onChange={(v) => store.updateElement(el.id, { lineHeight: v }, false)} />
      </div>
      <div className="mt-2">
        <SliderField label="Letter Spacing" value={el.letterSpacing} min={-10} max={30} step={0.5} onChange={(v) => store.updateElement(el.id, { letterSpacing: v }, false)} />
      </div>
    </Section>
  );
}

function ImageProperties({ el }: { el: ImageElement }) {
  const a = el.adjustments;
  return (
    <>
      <Section title="Quick Looks">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_LOOKS.map((ql) => (
            <button
              key={ql.id}
              onClick={() => {
                const newAdj = applyQuickLook(a, ql.id);
                store.updateElement(el.id, { adjustments: newAdj });
              }}
              className={`px-2 py-2 rounded-md text-[10px] font-medium border transition-colors ${
                a.quickLook === ql.id
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              {ql.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => store.updateElement(el.id, { adjustments: resetAdjustments() })}
          className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300"
        >
          Reset all adjustments
        </button>
      </Section>

      <Section title="Adjust">
        <SliderField icon={<Sun size={12} />} label="Brightness" value={a.brightness} min={0} max={200} suffix="%" onChange={(v) => store.updateElement(el.id, { adjustments: { ...a, brightness: v, quickLook: 'none' } }, false)} />
        <SliderField icon={<Contrast size={12} />} label="Contrast" value={a.contrast} min={0} max={200} suffix="%" onChange={(v) => store.updateElement(el.id, { adjustments: { ...a, contrast: v, quickLook: 'none' } }, false)} />
        <SliderField icon={<Droplet size={12} />} label="Saturation" value={a.saturation} min={0} max={200} suffix="%" onChange={(v) => store.updateElement(el.id, { adjustments: { ...a, saturation: v, quickLook: 'none' } }, false)} />
        <SliderField icon={<Circle size={12} />} label="Blur" value={a.blur} min={0} max={20} step={0.5} suffix="px" onChange={(v) => store.updateElement(el.id, { adjustments: { ...a, blur: v, quickLook: 'none' } }, false)} />
      </Section>

      <Section title="Transform">
        <div className="flex items-center gap-2">
          <IconBtn active={a.flipH} onClick={() => store.updateElement(el.id, { adjustments: { ...a, flipH: !a.flipH } })}><FlipHorizontal size={16} /></IconBtn>
          <IconBtn active={a.flipV} onClick={() => store.updateElement(el.id, { adjustments: { ...a, flipV: !a.flipV } })}><FlipVertical size={16} /></IconBtn>
          <IconBtn onClick={() => store.updateElement(el.id, { adjustments: { ...a, rotation: (a.rotation + 90) % 360 } })}><RotateCw size={16} /></IconBtn>
        </div>
      </Section>

      <Section title="Corner Radius">
        <SliderField label="Radius" value={el.cornerRadius} min={0} max={200} onChange={(v) => store.updateElement(el.id, { cornerRadius: v }, false)} />
      </Section>
    </>
  );
}

function ShapeProperties({ el }: { el: ShapeElement }) {
  return (
    <Section title="Shape">
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-gray-500">Fill</label>
          <ColorRow value={el.fill} onChange={(c) => store.updateElement(el.id, { fill: c })} />
        </div>
        <div>
          <label className="text-[10px] text-gray-500">Stroke</label>
          <ColorRow value={el.stroke === 'transparent' ? '#ffffff' : el.stroke} onChange={(c) => store.updateElement(el.id, { stroke: c })} />
        </div>
        <SliderField label="Stroke Width" value={el.strokeWidth} min={0} max={50} onChange={(v) => store.updateElement(el.id, { strokeWidth: v }, false)} />
        {el.shape === 'rect' && (
          <SliderField label="Corner Radius" value={el.cornerRadius} min={0} max={200} onChange={(v) => store.updateElement(el.id, { cornerRadius: v }, false)} />
        )}
      </div>
    </Section>
  );
}

function LayersPanel() {
  const editor = useEditor();
  const elements = [...editor.document.elements].reverse();
  return (
    <div className="border-t border-black/30 max-h-48 overflow-y-auto">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 uppercase sticky top-0 bg-[#26262e]">
        <LayersIcon size={12} /> Layers
      </div>
      <div className="px-2 pb-2 space-y-1">
        {elements.length === 0 && (
          <div className="text-[10px] text-gray-600 px-2 py-1">No layers yet</div>
        )}
        {elements.map((el) => (
          <div
            key={el.id}
            onClick={() => store.select([el.id])}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs ${
              editor.selectedIds.includes(el.id) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] text-gray-500 uppercase">{el.type === 'shape' ? el.shape : el.type}</span>
            <span className="flex-1 truncate">{el.type === 'text' ? el.text.slice(0, 20) : el.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); store.updateElement(el.id, { hidden: !el.hidden }); }}
              className="text-gray-500 hover:text-gray-300"
            >
              {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); store.updateElement(el.id, { locked: !el.locked }); }}
              className="text-gray-500 hover:text-gray-300"
            >
              {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">{title}</h4>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function SliderField({
  label, value, min, max, step = 1, suffix = '', icon, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; icon?: React.ReactNode; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500 flex items-center gap-1">{icon}{label}</span>
        <span className="text-[10px] text-gray-400">{Math.round(value * 10) / 10}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-black/30 border border-white/10 rounded-md px-2 py-1 text-xs text-gray-200 font-mono"
      />
    </div>
  );
}

function IconBtn({
  children, onClick, active, title,
}: {
  children: React.ReactNode; onClick: () => void; active?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
