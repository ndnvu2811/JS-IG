import React from "react";
import { AspectRatio, FilterState } from "../../types";
import MaterialSymbol from "../icons/MaterialSymbol";

interface EditorSidebarProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (val: AspectRatio) => void;
  onRotate: () => void;
  isFlippedH: boolean;
  setIsFlippedH: (val: boolean) => void;
  isFlippedV: boolean;
  setIsFlippedV: (val: boolean) => void;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, val: number) => void;
  onResetFilters: () => void;
  batchName: string;
  setBatchName: (name: string) => void;
  imageCount: number;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  aspectRatio,
  setAspectRatio,
  onRotate,
  isFlippedH,
  setIsFlippedH,
  isFlippedV,
  setIsFlippedV,
  filters,
  onFilterChange,
  onResetFilters,
  batchName,
  setBatchName,
  imageCount,
}) => {
  return (
    <aside className="lg:basis-[30%] w-full flex flex-col bg-white dark:bg-content-dark rounded-2xl border border-gray-200 dark:border-border-dark shadow-sm flex-shrink-0 h-full overflow-hidden">
      <div className="flex flex-col h-full p-8 space-y-8 overflow-y-auto table-scrollbar">
        {imageCount > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-[10px] bg-instagram-purple/10 text-instagram-purple">
                <MaterialSymbol icon="collections" className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-lg">Batch Name</h3>
            </div>
            <input 
              type="text" 
              value={batchName} 
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="Enter batch name..."
              className="w-full px-4 py-3 rounded-[10px] bg-transparent border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white focus:border-instagram-purple focus:ring-2 focus:ring-instagram-purple/20 transition-all"
            />
            {batchName.trim() === '' && (
              <div className="flex items-center gap-1.5 mt-2 text-instagram-orange">
                <MaterialSymbol icon="info" className="text-sm" />
                <span className="text-xs">Name required for batch saving</span>
              </div>
            )}
          </section>
        )}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-[10px] bg-instagram-purple/10 text-instagram-purple">
                <MaterialSymbol icon="crop" className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-lg">Canvas Settings</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Free", val: "free" },
              { label: "1:1", val: "1:1" },
              { label: "4:5", val: "4:5" },
              { label: "16:9", val: "16:9" },
            ].map((ratio) => {
              const isActive = aspectRatio === ratio.val;
              return (
                <button
                  key={ratio.val}
                  onClick={() => setAspectRatio(ratio.val as AspectRatio)}
                  className={`py-3 rounded-[10px] text-sm transition-all duration-200 border ${isActive ? 'border-instagram-purple text-instagram-purple shadow-lg shadow-instagram-purple/30' : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-instagram-purple hover:shadow-lg hover:shadow-instagram-purple/20'}`}
                >
                  {ratio.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
                onClick={onRotate}
                title="Rotate 90°"
                className="flex items-center justify-center py-2.5 rounded-[10px] bg-transparent text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-instagram-purple hover:text-instagram-purple hover:shadow-md hover:shadow-instagram-purple/20 transition-all duration-200"
            >
                <MaterialSymbol icon="rotate_right" className="text-lg" />
            </button>

            <button
                onClick={() => setIsFlippedH(!isFlippedH)}
                title="Flip Horizontal"
                className={`flex items-center justify-center py-2.5 rounded-[10px] transition-all duration-200 border ${
                    isFlippedH
                        ? 'border-instagram-purple text-instagram-purple shadow-md shadow-instagram-purple/25'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-instagram-purple hover:text-instagram-purple hover:shadow-md hover:shadow-instagram-purple/20'
                }`}
            >
                <MaterialSymbol icon="flip" className="text-lg" />
            </button>

            <button
                onClick={() => setIsFlippedV(!isFlippedV)}
                title="Flip Vertical"
                className={`flex items-center justify-center py-2.5 rounded-[10px] transition-all duration-200 border ${
                    isFlippedV
                        ? 'border-instagram-purple text-instagram-purple shadow-md shadow-instagram-purple/25'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-instagram-purple hover:text-instagram-purple hover:shadow-md hover:shadow-instagram-purple/20'
                }`}
            >
                <MaterialSymbol icon="flip" className="text-lg rotate-90" />
            </button>
        </div>
          <p className="text-[12px] text-gray-500 mt-3">
            * Tip: Hold <b>Shift</b> while dragging corners for 1:1 resize
          </p>
        </section>

        <section className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-instagram-orange/10 text-instagram-orange">
                    <MaterialSymbol icon="tune" className="text-lg" />
                </div>
                <h3 className="font-bold text-white text-lg">Enhancement</h3>
            </div>
            <button
                onClick={onResetFilters}
                title="Reset all"
                className="flex items-center justify-center text-instagram-purple hover:text-instagram-purple/80 transition-all"
            >
                <MaterialSymbol icon="refresh" className="text-xl" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Brightness",
                icon: "light_mode",
                key: "brightness",
                min: 0,
                max: 200,
              },
              {
                label: "Contrast",
                icon: "contrast",
                key: "contrast",
                min: 0,
                max: 200,
              },
              {
                label: "Saturation",
                icon: "palette",
                key: "saturate",
                min: 0,
                max: 200,
              },
              {
                label: "Sepia Effect",
                icon: "auto_fix_high",
                key: "sepia",
                min: 0,
                max: 100,
              },
              {
                label: "Grayscale",
                icon: "gradient",
                key: "grayscale",
                min: 0,
                max: 100,
              },
              {
                label: "Hue Rotation",
                icon: "color_lens",
                key: "hueRotate",
                min: 0,
                max: 360,
              },
              {
                label: "Gaussian Blur",
                icon: "blur_on",
                key: "blur",
                min: 0,
                max: 10,
              },
            ].map((adj) => (
              <div key={adj.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <MaterialSymbol icon={adj.icon} className="text-lg" />
                    {adj.label}
                  </label>
                  <span className="font-mono text-sm text-purple-400 font-bold bg-purple-400/5 px-2 py-0.5 rounded">
                    {(filters as any)[adj.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={adj.min}
                  max={adj.max}
                  step={adj.key === "blur" ? 0.5 : 1}
                  value={(filters as any)[adj.key]}
                  onChange={(e) =>
                    onFilterChange(
                      adj.key as keyof FilterState,
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer accent-instagram-purple"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default EditorSidebar;
