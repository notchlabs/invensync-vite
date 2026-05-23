import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

export function ImagePreview({ src }: { src: string }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.005;
    setScale((s) => Math.min(Math.max(0.5, s + zoomFactor), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      const preventDefault = (e: Event) => {
        e.preventDefault();
      };
      el.addEventListener('wheel', preventDefault, { passive: false });
      return () => el.removeEventListener('wheel', preventDefault);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#111111] overflow-hidden group/zoom"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-[#333] z-10 opacity-0 group-hover/zoom:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors" title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <span className="text-[12px] font-bold text-white/80 w-12 text-center pointer-events-none">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <div className="w-px h-4 bg-[#333] mx-1" />
        <button onClick={reset} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors" title="Reset Zoom">
          <RefreshCcw size={14} />
        </button>
      </div>

      <div 
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <img 
          src={src} 
          alt="Preview" 
          className="max-w-full max-h-full object-contain pointer-events-none" 
        />
      </div>
    </div>
  );
}
