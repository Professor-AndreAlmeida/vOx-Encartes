import React, { useCallback, useState } from 'react';
import { Icons } from './Icon';
import * as pdfjsLib from 'pdfjs-dist';

// Fix: Handle PDF.js ESM import which might wrap exports in 'default'
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

// Configure Worker
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // State for Multi-page PDF
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);

  const renderPageToBuffer = async (pdf: any, pageNum: number, scale: number): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
        // Configura alta qualidade de renderização
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        return canvas.toDataURL('image/png');
    }
    throw new Error("Canvas context error");
  };

  const processFile = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    // Reset PDF state
    setPdfDoc(null);
    setPdfThumbnails([]);
    setShowPageSelector(false);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        if (pdf.numPages === 1) {
            // Se só tem 1 página, processa direto em ULTRA alta qualidade (Scale 4.0)
            // Isso garante que recortes pequenos tenham pixels suficientes
            const base64 = await renderPageToBuffer(pdf, 1, 4.0);
            onImageSelected(base64);
            setIsProcessing(false);
        } else {
            // Múltiplas páginas: Gerar thumbnails
            setPdfDoc(pdf);
            const thumbs: string[] = [];
            
            // Renderiza miniaturas (escala menor para performance na visualização)
            for (let i = 1; i <= pdf.numPages; i++) {
                const thumbBase64 = await renderPageToBuffer(pdf, i, 0.4); 
                thumbs.push(thumbBase64);
            }
            
            setPdfThumbnails(thumbs);
            setShowPageSelector(true);
            setIsProcessing(false);
        }

      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelected(reader.result as string);
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Formato não suportado. Por favor use Imagens (JPG, PNG) ou PDF.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao ler o arquivo. Se for PDF, verifique se não está corrompido.");
      setIsProcessing(false);
    }
  };

  const handlePageSelect = async (pageIndex: number) => {
      if (!pdfDoc) return;
      setIsProcessing(true);
      try {
          // Renderiza a página selecionada em ULTRA alta qualidade (Scale 4.0)
          const highResBase64 = await renderPageToBuffer(pdfDoc, pageIndex + 1, 4.0);
          onImageSelected(highResBase64);
      } catch (e) {
          console.error(e);
          alert("Erro ao processar a página selecionada.");
      } finally {
          setIsProcessing(false);
          // Limpa memória
          setPdfDoc(null); 
          setPdfThumbnails([]);
          setShowPageSelector(false);
      }
  };

  const handleCancelSelection = () => {
      setPdfDoc(null);
      setPdfThumbnails([]);
      setShowPageSelector(false);
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  }, [onImageSelected]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onImageSelected]);

  // View: Seletor de Páginas
  if (showPageSelector) {
      return (
          <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl p-6 border border-slate-700 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Icons.Image className="w-5 h-5 text-blue-500" />
                        Selecione a Página
                    </h3>
                    <p className="text-sm text-slate-400">Este arquivo contém {pdfThumbnails.length} páginas. Qual deseja usar?</p>
                  </div>
                  <button 
                    onClick={handleCancelSelection}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                      <Icons.Close className="w-4 h-4" /> Cancelar
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {pdfThumbnails.map((thumb, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handlePageSelect(idx)}
                            disabled={isProcessing}
                            className="group relative aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-lg border-2 border-transparent hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all focus:outline-none"
                          >
                              <img src={thumb} alt={`Página ${idx + 1}`} className="w-full h-full object-contain" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center font-medium opacity-80 group-hover:opacity-100">
                                  Página {idx + 1}
                              </div>
                              {isProcessing && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <Icons.Loader className="w-6 h-6 animate-spin text-white" />
                                  </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // View: Zona de Upload Padrão
  return (
    <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`w-full h-full flex flex-col items-center justify-center bg-slate-900 border-2 border-dashed rounded-xl p-8 transition-all group cursor-pointer relative ${
            dragActive 
            ? 'border-blue-500 bg-blue-900/20' 
            : 'border-slate-700 hover:bg-slate-800/50 hover:border-blue-500/50'
        }`}
    >
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        onChange={handleFileChange} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={isProcessing}
      />
      
      {isProcessing ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icons.Loader className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-200">Processando Arquivo...</h3>
              <p className="text-sm text-slate-400 mt-1">Gerando versão em alta resolução (4x)</p>
          </div>
      ) : (
          <>
            <div className={`bg-slate-800 p-5 rounded-full shadow-lg transition-transform mb-6 border border-slate-700 ${dragActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <Icons.Upload className={`w-10 h-10 ${dragActive ? 'text-white' : 'text-blue-500'}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Carregar Encarte</h3>
            <p className="text-sm text-slate-400 text-center max-w-md leading-relaxed">
                <span className="text-blue-400 font-medium">Clique</span> para buscar ou <span className="text-blue-400 font-medium">arraste</span> seu arquivo aqui.<br/>
                Suporta <span className="text-slate-300 font-mono text-xs bg-slate-800 px-1 rounded">PDF</span> (Alta Resolução), <span className="text-slate-300 font-mono text-xs bg-slate-800 px-1 rounded">JPG</span> e <span className="text-slate-300 font-mono text-xs bg-slate-800 px-1 rounded">PNG</span>.
            </p>
          </>
      )}
    </div>
  );
};