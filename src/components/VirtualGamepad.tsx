import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';

interface VirtualGamepadProps {
  activeKeys: Record<string, boolean>;
  onPress: (key: string) => void;
  onRelease: (key: string) => void;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  activeKeys,
  onPress,
  onRelease,
}) => {
  const handleTouch = (key: string, start: boolean) => {
    if (start) {
      retroAudio.playSelect();
      onPress(key);
    } else {
      onRelease(key);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl select-none max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Left: D-PAD Cross */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* D-Pad Background cross */}
          <div className="absolute w-12 h-36 bg-slate-950 rounded-lg border border-slate-800" />
          <div className="absolute w-36 h-12 bg-slate-950 rounded-lg border border-slate-800" />

          {/* D-PAD UP */}
          <button
            onPointerDown={() => handleTouch('up', true)}
            onPointerUp={() => handleTouch('up', false)}
            onPointerLeave={() => handleTouch('up', false)}
            className={`absolute top-0 w-12 h-12 flex items-center justify-center rounded-t-lg transition-colors cursor-pointer ${
              activeKeys.up ? 'bg-rose-600 text-white shadow-inner' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            aria-label="Up"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* D-PAD DOWN */}
          <button
            onPointerDown={() => handleTouch('down', true)}
            onPointerUp={() => handleTouch('down', false)}
            onPointerLeave={() => handleTouch('down', false)}
            className={`absolute bottom-0 w-12 h-12 flex items-center justify-center rounded-b-lg transition-colors cursor-pointer ${
              activeKeys.down ? 'bg-rose-600 text-white shadow-inner' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            aria-label="Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          {/* D-PAD LEFT */}
          <button
            onPointerDown={() => handleTouch('left', true)}
            onPointerUp={() => handleTouch('left', false)}
            onPointerLeave={() => handleTouch('left', false)}
            className={`absolute left-0 w-12 h-12 flex items-center justify-center rounded-l-lg transition-colors cursor-pointer ${
              activeKeys.left ? 'bg-rose-600 text-white shadow-inner' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            aria-label="Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* D-PAD RIGHT */}
          <button
            onPointerDown={() => handleTouch('right', true)}
            onPointerUp={() => handleTouch('right', false)}
            onPointerLeave={() => handleTouch('right', false)}
            className={`absolute right-0 w-12 h-12 flex items-center justify-center rounded-r-lg transition-colors cursor-pointer ${
              activeKeys.right ? 'bg-rose-600 text-white shadow-inner' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            aria-label="Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Center Pivot */}
          <div className="absolute w-5 h-5 bg-slate-900 rounded-full border border-slate-700" />
        </div>

        {/* Center: Select & Start pill buttons */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <button
              onPointerDown={() => handleTouch('select', true)}
              onPointerUp={() => handleTouch('select', false)}
              onPointerLeave={() => handleTouch('select', false)}
              className={`w-14 h-6 rounded-full border border-slate-700 -rotate-12 transition-all cursor-pointer ${
                activeKeys.select ? 'bg-slate-300 shadow-inner' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            />
            <span className="font-pixel text-[8px] text-slate-400">SELECT</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onPointerDown={() => handleTouch('start', true)}
              onPointerUp={() => handleTouch('start', false)}
              onPointerLeave={() => handleTouch('start', false)}
              className={`w-14 h-6 rounded-full border border-slate-700 -rotate-12 transition-all cursor-pointer ${
                activeKeys.start ? 'bg-rose-500 shadow-inner' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            />
            <span className="font-pixel text-[8px] text-slate-400">START</span>
          </div>
        </div>

        {/* Right: Face Buttons (SNES style A, B, X, Y) */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          
          {/* Button Y (Left) */}
          <button
            onPointerDown={() => handleTouch('y', true)}
            onPointerUp={() => handleTouch('y', false)}
            onPointerLeave={() => handleTouch('y', false)}
            className={`absolute left-0 w-11 h-11 rounded-full font-pixel text-xs font-bold border-2 border-emerald-600/40 shadow-md transition-all cursor-pointer flex items-center justify-center ${
              activeKeys.y ? 'bg-emerald-500 text-white scale-95 shadow-inner' : 'bg-emerald-700 text-white hover:bg-emerald-600'
            }`}
          >
            Y
          </button>

          {/* Button X (Top) */}
          <button
            onPointerDown={() => handleTouch('x', true)}
            onPointerUp={() => handleTouch('x', false)}
            onPointerLeave={() => handleTouch('x', false)}
            className={`absolute top-0 w-11 h-11 rounded-full font-pixel text-xs font-bold border-2 border-sky-600/40 shadow-md transition-all cursor-pointer flex items-center justify-center ${
              activeKeys.x ? 'bg-sky-500 text-white scale-95 shadow-inner' : 'bg-sky-700 text-white hover:bg-sky-600'
            }`}
          >
            X
          </button>

          {/* Button B (Bottom) */}
          <button
            onPointerDown={() => handleTouch('b', true)}
            onPointerUp={() => handleTouch('b', false)}
            onPointerLeave={() => handleTouch('b', false)}
            className={`absolute bottom-0 w-11 h-11 rounded-full font-pixel text-xs font-bold border-2 border-amber-600/40 shadow-md transition-all cursor-pointer flex items-center justify-center ${
              activeKeys.b ? 'bg-amber-500 text-white scale-95 shadow-inner' : 'bg-amber-700 text-white hover:bg-amber-600'
            }`}
          >
            B
          </button>

          {/* Button A (Right) */}
          <button
            onPointerDown={() => handleTouch('a', true)}
            onPointerUp={() => handleTouch('a', false)}
            onPointerLeave={() => handleTouch('a', false)}
            className={`absolute right-0 w-11 h-11 rounded-full font-pixel text-xs font-bold border-2 border-rose-600/40 shadow-md transition-all cursor-pointer flex items-center justify-center ${
              activeKeys.a ? 'bg-rose-500 text-white scale-95 shadow-inner' : 'bg-rose-700 text-white hover:bg-rose-600'
            }`}
          >
            A
          </button>

        </div>

      </div>
    </div>
  );
};
