import React, { useState } from "react";
import { TextOverlay, LogoOverlay } from "../../types";
import MaterialSymbol from "../icons/MaterialSymbol";
import NumberInputControl from '../care-activities/NumberInputControl';

interface ReelSidebarProps {
  videoScale: number;
  setVideoScale: (v: number) => void;
  videoX: number;
  setVideoX: (v: number) => void;
  videoY: number;
  setVideoY: (v: number) => void;
  originalVolume: number;
  setOriginalVolume: (v: number) => void;
  musicUrl: string | null;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  onImportMusic: () => void;
  onRemoveMusic: () => void;
  texts: TextOverlay[];
  onAddText: () => void;
  onRemoveText: (id: string) => void;
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
  logos: LogoOverlay[];
  onImportLogo: () => void;
  onUpdateLogo: (id: string, updates: Partial<LogoOverlay>) => void;
  onRemoveLogo: (id: string) => void;
}

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}> = ({ title, icon, children, defaultOpen = true, color = "purple" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorMap: Record<string, string> = {
    purple: "border-instagram-purple/20 bg-instagram-purple/10 text-instagram-purple",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-500",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-500",
  };

  return (
    <section>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 mb-2 hover:opacity-80 transition-opacity py-1"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 flex items-center justify-center rounded border text-xs ${colorMap[color]}`}>
            <MaterialSymbol icon={icon} className="text-xs" />
          </div>
          <h3 className="font-bold text-white text-xs truncate">{title}</h3>
        </div>
        <MaterialSymbol 
          icon={isOpen ? "expand_less" : "expand_more"} 
          className="text-sm text-gray-500 flex-shrink-0"
        />
      </button>
      
      {isOpen && (
        <div className="pl-0 space-y-2">
          {children}
        </div>
      )}
    </section>
  );
};

const CompactSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  color?: string;
}> = ({ label, value, onChange, min = 0, max = 100, unit = "%", color = "purple" }) => {
  const accentMap: Record<string, string> = {
    purple: "accent-instagram-purple",
    blue: "accent-blue-500",
    emerald: "accent-emerald-500",
    orange: "accent-orange-500",
  };

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500">
        <span>{label}</span>
        <span className="text-white">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer ${accentMap[color]}`}
      />
    </div>
  );
};

const ReelSidebar: React.FC<ReelSidebarProps> = ({
  videoScale,
  setVideoScale,
  videoX,
  setVideoX,
  videoY,
  setVideoY,
  originalVolume,
  setOriginalVolume,
  musicUrl,
  musicVolume,
  setMusicVolume,
  onImportMusic,
  onRemoveMusic,
  texts,
  onAddText,
  onRemoveText,
  onUpdateText,
  logos,
  onImportLogo,
  onUpdateLogo,
  onRemoveLogo,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'text' | 'logo'>('video');

  return (
    <aside className="w-[340px] flex flex-col bg-white dark:bg-content-dark rounded-2xl border border-gray-200 dark:border-border-dark shadow-sm flex-shrink-0 h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-gray-700 bg-gray-900/50">
        {[
          { id: 'video' as const, icon: 'video_settings', label: 'Video' },
          { id: 'audio' as const, icon: 'volume_up', label: 'Audio' },
          { id: 'text' as const, icon: 'text_fields', label: 'Text' },
          { id: 'logo' as const, icon: 'branding_watermark', label: 'Logo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-instagram-purple/30 text-instagram-purple'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <MaterialSymbol icon={tab.icon} className="text-xs" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* VIDEO TAB */}
        {activeTab === 'video' && (
          <div className="space-y-2">
            <CollapsibleSection title="Video Transform" icon="video_settings" color="purple">
              <div className="space-y-2 bg-gray-800/20 p-2 rounded-lg text-xs">
                <CompactSlider 
                  label="Upscale" 
                  value={videoScale} 
                  onChange={setVideoScale}
                  min={100}
                  max={500}
                  unit="%"
                  color="purple"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold uppercase text-gray-500">X</span>
                    <input
                      type="number"
                      value={videoX}
                      onChange={(e) => setVideoX(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white text-center font-mono focus:ring-1 focus:ring-instagram-purple outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold uppercase text-gray-500">Y</span>
                    <input
                      type="number"
                      value={videoY}
                      onChange={(e) => setVideoY(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white text-center font-mono focus:ring-1 focus:ring-instagram-purple outline-none"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-2">
            <CollapsibleSection title="Audio Mixer" icon="volume_up" color="blue">
              <div className="space-y-2 bg-gray-800/20 p-2 rounded-lg">
                <CompactSlider 
                  label="Original Audio" 
                  value={originalVolume} 
                  onChange={setOriginalVolume}
                  color="blue"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Background Music" icon="music_note" color="blue">
              {!musicUrl ? (
                <button
                  onClick={onImportMusic}
                  className="w-full py-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-700 bg-gray-800/40 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-[10px] font-bold text-gray-300 hover:text-blue-400"
                >
                  <MaterialSymbol icon="music_note" className="text-sm" />
                  Add Music
                </button>
              ) : (
                <div className="space-y-2 bg-blue-500/5 p-2 rounded-lg border border-blue-500/20">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-blue-400">
                      <MaterialSymbol icon="music_note" className="text-sm" />
                      <span className="font-bold uppercase">Music</span>
                    </div>
                    <button
                      onClick={onRemoveMusic}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <MaterialSymbol icon="close" className="text-xs" />
                    </button>
                  </div>
                  <CompactSlider 
                    label="Volume" 
                    value={musicVolume} 
                    onChange={setMusicVolume}
                    color="blue"
                  />
                </div>
              )}
            </CollapsibleSection>
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-bold uppercase text-gray-400">Captions ({texts.length})</h3>
              <button 
                onClick={onAddText}
                className="text-[9px] font-bold uppercase text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 transition-all"
              >
                + Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {texts.map((t, idx) => (
                <div key={t.id} className="space-y-1 p-2 bg-gray-800/40 rounded border border-gray-700/50 text-[10px]">
                  <div className="flex items-center justify-between gap-1">
                    <input 
                      type="text" 
                      value={t.text} 
                      onChange={(e) => onUpdateText(t.id, { text: e.target.value })} 
                      className="bg-transparent border-none p-0 text-xs font-bold text-white focus:ring-0 placeholder-gray-600 w-full"
                      placeholder="Text..."
                    />
                    <button onClick={() => onRemoveText(t.id)} className="text-gray-500 hover:text-red-500 flex-shrink-0">
                      <MaterialSymbol icon="close" className="text-xs" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold uppercase text-gray-500">X</span>
                      <input
                        type="number"
                        value={t.x}
                        onChange={(e) => onUpdateText(t.id, { x: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-xs text-white text-center font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold uppercase text-gray-500">Y</span>
                      <input
                        type="number"
                        value={t.y}
                        onChange={(e) => onUpdateText(t.id, { y: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-xs text-white text-center font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold uppercase text-gray-500">Size</span>
                      <input 
                        type="number" 
                        value={t.fontSize} 
                        onChange={(e) => onUpdateText(t.id, { fontSize: parseInt(e.target.value) || 12 })} 
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-xs text-white text-center font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase text-gray-500">Color</span>
                    <div className="relative h-5 w-5 rounded border border-gray-700 overflow-hidden bg-gray-900">
                      <input 
                        type="color" 
                        value={t.color} 
                        onChange={(e) => onUpdateText(t.id, { color: e.target.value })} 
                        className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-[2.5]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {texts.length === 0 && (
                <p className="text-center text-gray-500 text-[9px] py-3">No captions yet</p>
              )}
            </div>
          </div>
        )}

        {/* LOGO TAB */}
        {activeTab === 'logo' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-bold uppercase text-gray-400">Logos ({logos.length})</h3>
            </div>

            {/* Logo grid */}
            <div className="grid grid-cols-5 gap-1.5">
              <button 
                onClick={onImportLogo} 
                className="aspect-square flex items-center justify-center rounded border border-dashed border-gray-700 bg-gray-800/40 hover:border-orange-500 hover:bg-orange-500/5 transition-all text-lg"
              >
                <MaterialSymbol icon="add" className="text-sm text-gray-600" />
              </button>
              {logos.map((logo) => (
                <div
                  key={logo.id}
                  className="aspect-square relative group bg-gray-800 rounded border border-gray-700 overflow-hidden cursor-pointer"
                >
                  <img src={logo.url} className="w-full h-full object-contain p-0.5" alt="Logo" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveLogo(logo.id);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded hover:scale-110 transition-transform"
                    >
                      <MaterialSymbol icon="close" className="text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Logo settings */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 border-t border-gray-700 pt-2">
              {logos.map((logo, idx) => (
                <div key={`settings-${logo.id}`} className="space-y-1 p-2 bg-gray-800/40 rounded border border-gray-700/50 text-[10px]">
                  <span className="text-[8px] font-bold uppercase text-gray-500">Logo #{idx + 1}</span>
                  
                  <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold uppercase text-gray-500">X</span>
                      <input
                        type="number"
                        value={logo.x}
                        onChange={(e) => onUpdateLogo(logo.id, { x: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-xs text-white text-center font-mono focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold uppercase text-gray-500">Y</span>
                      <input
                        type="number"
                        value={logo.y}
                        onChange={(e) => onUpdateLogo(logo.id, { y: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-xs text-white text-center font-mono focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <CompactSlider 
                    label="Scale" 
                    value={logo.size} 
                    onChange={(v) => onUpdateLogo(logo.id, { size: v })}
                    min={5}
                    max={100}
                    color="orange"
                  />

                  <CompactSlider 
                    label="Opacity" 
                    value={logo.opacity} 
                    onChange={(v) => onUpdateLogo(logo.id, { opacity: v })}
                    min={0}
                    max={100}
                    color="orange"
                  />
                </div>
              ))}
              {logos.length === 0 && (
                <p className="text-center text-gray-500 text-[9px] py-3">No logos added yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ReelSidebar;
