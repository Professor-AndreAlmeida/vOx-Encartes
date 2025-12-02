import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icon';

interface ExtractionWorkspaceProps {
  imageSrc: string;
  onExtract: (cropBase64: string) => void;
  onBack: () => void;
}

type ToolMode = 'select' | 'pan';

export const ExtractionWorkspace: React.FC<ExtractionWorkspaceProps> = ({ 
  imageSrc, 
  onExtract,
  onBack 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Transform State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Selection State
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  
  // Tools
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper: Get coordinates relative to the image element
  const getImgCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x: x / scale, y: y / scale };
  };

  // --- Zoom Logic ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const newScale = e.deltaY < 0 
      ? Math.min(scale + zoomIntensity, 5) 
      : Math.max(scale - zoomIntensity, 0.5);
    
    setScale(newScale);
  };

  // --- Mouse Event Controller ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (activeTool === 'pan' || e.button === 1) { 
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (activeTool === 'select') {
      const coords = getImgCoords(e);
      setSelectionStart(coords);
      setIsSelecting(true);
      setSelection({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isSelecting && selectionStart) {
      const current = getImgCoords(e);
      const x = Math.min(selectionStart.x, current.x);
      const y = Math.min(selectionStart.y, current.y);
      const w = Math.abs(current.x - selectionStart.x);
      const h = Math.abs(current.y - selectionStart.y);
      setSelection({ x, y, w, h });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsSelecting(false);
  };

  const handleExtract = () => {
    if (!imgRef.current || !selection || selection.w < 5 || selection.h < 5) return;

    const canvas = document.createElement('canvas');
    const cssWidth = imgRef.current.width; 
    const cssHeight = imgRef.current.height;
    
    const ratioX = imgRef.current.naturalWidth / cssWidth;
    const ratioY = imgRef.current.naturalHeight / cssHeight;

    canvas.width = selection.w * ratioX;
    canvas.height = selection.h * ratioY;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Configurar qualidade máxima de interpolação
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imgRef.current,
        selection.x * ratioX,
        selection.y * ratioY,
        selection.w * ratioX,
        selection.h * ratioY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const base64 = canvas.toDataURL('image/png', 1.0); // Qualidade máxima
      onExtract(base64);
      setSelection(null); 
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat) {
            setActiveTool('pan');
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            setActiveTool('select');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-slate-950 overflow-hidden relative selection:bg-none">
      
      {/* Top Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center z-20 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800" title="Voltar">
             <Icons.Close className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-700 mx-1"></div>
          
          {/* Tools */}
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
             <button 
                onClick={() => setActiveTool('select')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTool === 'select' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
             >
                <Icons.Scissors className="w-4 h-4" /> Selecionar
             </button>
             <button 
                onClick={() => setActiveTool('pan')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTool === 'pan' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
             >
                <Icons.Type className="w-4 h-4 rotate-45" /> Mover (Espaço)
             </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="p-2 hover:bg-slate-700 text-slate-300">
                 <Icons.PenTool className="w-4 h-4 rotate-180" />
              </button>
              <span className="text-xs font-mono w-12 text-center text-slate-300">
                 {Math.round(scale * 100)}%
              </span>
              <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="p-2 hover:bg-slate-700 text-slate-300">
                 <Icons.Plus className="w-4 h-4" />
              </button>
           </div>
           
           <button 
             onClick={() => { setScale(1); setPan({x:0, y:0}); }} 
             className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
             title="Resetar Zoom"
           >
              <Icons.RotateCcw className="w-4 h-4" />
           </button>

           <button 
             onClick={toggleFullscreen}
             className={`p-2 rounded-lg transition-colors ${isFullscreen ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             title="Tela Cheia"
           >
              <Icons.Maximize className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden relative bg-[#1a1b26] cursor-crosshair"
           onWheel={handleWheel}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
           style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : 'crosshair' }}
      >
        {/* Transforming Container */}
        <div 
            className="absolute origin-center transition-transform duration-75 ease-out will-change-transform"
            style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                left: '50%',
                top: '50%',
                marginLeft: `-${(imgRef.current?.width || 0)/2}px`, 
                marginTop: `-${(imgRef.current?.height || 0)/2}px`
            }}
        >
            <div className="relative shadow-2xl shadow-black">
                <img 
                    ref={imgRef} 
                    src={imageSrc} 
                    alt="Workspace" 
                    className="max-w-none select-none pointer-events-none block" 
                    onDragStart={(e) => e.preventDefault()}
                    style={{ 
                        maxHeight: scale === 1 && pan.x === 0 && pan.y === 0 ? '80vh' : 'none',
                        maxWidth: scale === 1 && pan.x === 0 && pan.y === 0 ? '90vw' : 'none',
                    }}
                />
                
                {/* Selection Box */}
                {selection && (
                    <div 
                    className="absolute border border-white bg-blue-500/20 box-border shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                    style={{
                        left: selection.x,
                        top: selection.y,
                        width: selection.w,
                        height: selection.h,
                    }}
                    >
                    {!isSelecting && !isPanning && selection.w > 10 && (
                        <div 
                            className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in duration-200"
                            style={{ transform: `translateX(-50%) scale(${1/scale})` }} 
                        >
                        <button 
                            onClick={(e) => { 
                            e.stopPropagation(); 
                            handleExtract(); 
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-blue-400 whitespace-nowrap cursor-pointer pointer-events-auto"
                        >
                            <Icons.Scissors className="w-4 h-4" />
                            Extrair
                        </button>
                        </div>
                    )}
                    </div>
                )}
            </div>
        </div>

        {/* Instructions Overlay (fades out) */}
        {scale === 1 && !selection && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-slate-300 px-4 py-2 rounded-full text-xs border border-slate-700 pointer-events-none">
                Scroll para Zoom • Espaço para Mover
             </div>
        )}
      </div>
    </div>
  );
};