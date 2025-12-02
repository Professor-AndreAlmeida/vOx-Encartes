
import React, { useState } from 'react';
import { ExtractedProduct } from '../types';
import { Icons } from './Icon';
import { editProductImage } from '../services/geminiService';

interface ProductEditorProps {
  product: ExtractedProduct;
  onUpdate: (id: string, newImage: string, promptUsed: string) => void;
  onClose: () => void;
}

type ActionCategory = 'cleanup' | 'style' | 'marketing';

interface EditorVersion {
  id: string;
  image: string;
  prompt: string;
  timestamp: number;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ product, onUpdate, onClose }) => {
  // Inicializa o histórico com a imagem atual do produto (ou original se não tiver editada)
  const [versions, setVersions] = useState<EditorVersion[]>(() => [
    {
      id: 'original',
      image: product.originalCrop, // Começa sempre do crop original para ter a base
      prompt: 'Original',
      timestamp: Date.now()
    },
    // Se o produto já tinha uma edição salva, adiciona ela como v2
    ...(product.processedImage ? [{
        id: 'current-save',
        image: product.processedImage,
        prompt: 'Última Edição Salva',
        timestamp: Date.now() + 1
    }] : [])
  ]);

  const [currentVersionIdx, setCurrentVersionIdx] = useState<number>(
    product.processedImage ? 1 : 0
  );

  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ message: string, details?: string } | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActionCategory>('cleanup');
  
  // A imagem ativa é baseada no índice selecionado na linha do tempo
  const activeImage = versions[currentVersionIdx].image;

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    setShowErrorDetails(false);

    try {
      // IMPORTANTE: Edita sobre a imagem ATIVA (Chaining)
      const resultBase64 = await editProductImage(activeImage, prompt);
      
      const newVersion: EditorVersion = {
        id: Math.random().toString(36).substr(2, 9),
        image: resultBase64,
        prompt: prompt,
        timestamp: Date.now()
      };

      setVersions(prev => [...prev, newVersion]);
      setCurrentVersionIdx(prev => prev + 1); // Move seleção para a nova imagem
      setPrompt(""); 
    } catch (err: any) {
      console.error(err);
      // Capture friendly message and technical details
      setError({
          message: err.message || "Falha desconhecida ao processar imagem.",
          details: err.technicalDetails || JSON.stringify(err)
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAndClose = () => {
    // Salva apenas a versão que o usuário está visualizando no momento
    const versionToSave = versions[currentVersionIdx];
    
    // Se for a original, remove a edição processada
    if (versionToSave.id === 'original') {
        onUpdate(product.id, '', 'Revertido para Original');
    } else {
        onUpdate(product.id, versionToSave.image, versionToSave.prompt);
    }
    onClose();
  };

  const renderQuickActions = () => {
    switch (activeCategory) {
      case 'cleanup':
        return (
          <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
             <button onClick={() => handleQuickPrompt("Remover apenas o fundo, mantendo o produto em fundo branco puro (RGB 255,255,255). Recorte preciso.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-blue-900/20 rounded-lg shrink-0"><Icons.Scissors className="w-4 h-4 text-blue-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Remover Fundo</span>
                  <span className="text-[10px] text-slate-500">Recorte profissional em fundo branco</span>
                </div>
             </button>

             <button onClick={() => handleQuickPrompt("Remover textos, preços, selos e marcas d'água sobre a imagem. Manter apenas a embalagem do produto limpa e restaurar as partes cobertas.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-red-900/20 rounded-lg shrink-0"><Icons.Eraser className="w-4 h-4 text-red-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Limpar Textos/Preços</span>
                  <span className="text-[10px] text-slate-500">Remove poluição visual da imagem</span>
                </div>
             </button>

             <button onClick={() => handleQuickPrompt("Ajustar iluminação para fotografia de estúdio, aumentar nitidez, corrigir balanço de branco e realçar cores do produto.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-amber-900/20 rounded-lg shrink-0"><Icons.Sun className="w-4 h-4 text-amber-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Melhorar Qualidade</span>
                  <span className="text-[10px] text-slate-500">Iluminação e nitidez de estúdio</span>
                </div>
             </button>
          </div>
        );
      case 'style':
        return (
          <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
             <button onClick={() => handleQuickPrompt("Transforme a imagem em uma arte vetorial 2D Flat Design. Remova texturas realistas e sombreamento 3D. Use cores sólidas e chapadas. Estilo iconográfico minimalista tipo Adobe Illustrator. Fundo branco.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-purple-900/20 rounded-lg shrink-0"><Icons.PenTool className="w-4 h-4 text-purple-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Vetorizar (Flat)</span>
                  <span className="text-[10px] text-slate-500">Estilo ilustração vetorial 2D</span>
                </div>
             </button>

             <button onClick={() => handleQuickPrompt("Adicionar linhas de cota técnica e medidas ao redor do produto (linhas tracejadas com setas), estilo desenho técnico de engenharia.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-cyan-900/20 rounded-lg shrink-0"><Icons.Ruler className="w-4 h-4 text-cyan-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Medidas Técnicas</span>
                  <span className="text-[10px] text-slate-500">Adiciona linhas de dimensão visuais</span>
                </div>
             </button>

             <button onClick={() => handleQuickPrompt("Aplicar filtro vintage retrô, granulação de filme, cores levemente desbotadas estilo anos 80.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-pink-900/20 rounded-lg shrink-0"><Icons.Wand className="w-4 h-4 text-pink-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Filtro Retrô</span>
                  <span className="text-[10px] text-slate-500">Estilo vintage estético</span>
                </div>
             </button>
          </div>
        );
      case 'marketing':
        return (
          <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
             <button onClick={() => handleQuickPrompt("Adicionar um selo circular vermelho brilhante no canto superior direito escrito 'OFERTA' em letras brancas impactantes.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-red-900/20 rounded-lg shrink-0"><Icons.Tag className="w-4 h-4 text-red-500" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Selo de Oferta</span>
                  <span className="text-[10px] text-slate-500">Adiciona badge 'OFERTA'</span>
                </div>
             </button>

             <button onClick={() => handleQuickPrompt("Adicionar uma etiqueta de preço amarela moderna abaixo do produto, com o texto 'R$ 9,99' em preto negrito (placeholder).")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-yellow-900/20 rounded-lg shrink-0"><Icons.Type className="w-4 h-4 text-yellow-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Etiqueta de Preço</span>
                  <span className="text-[10px] text-slate-500">Cria base para precificação</span>
                </div>
             </button>

             <button onClick={() => handleQuickPrompt("Adicionar efeito de brilho e raios de luz atrás do produto para destaque 'Hero Hero', estilo banner promocional.")} 
                className="quick-btn group flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left w-full transition-all">
                <div className="p-2 bg-blue-900/20 rounded-lg shrink-0"><Icons.Zap className="w-4 h-4 text-blue-400" /></div>
                <div>
                  <span className="block font-medium text-slate-200 text-sm">Destaque Hero</span>
                  <span className="text-[10px] text-slate-500">Raios de luz e brilho</span>
                </div>
             </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex overflow-hidden border border-slate-800">
        
        {/* Left: Image Workspace & Timeline */}
        <div className="w-2/3 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-slate-950 flex flex-col relative border-r border-slate-800">
          
          {/* Header Overlay */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
             <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 border border-slate-700 shadow-sm flex items-center gap-2">
                <Icons.Image className="w-3 h-3" />
                <span>Visualizando: {versions[currentVersionIdx].prompt}</span>
             </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
             {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-pulse z-20">
                  <div className="relative">
                    <img 
                      src={activeImage} 
                      className="max-h-[50vh] opacity-50 blur-sm transition-all rounded-lg" 
                      alt="Processing"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="bg-slate-900/80 p-4 rounded-full border border-blue-500/50 shadow-2xl shadow-blue-500/20">
                          <Icons.Loader className="w-10 h-10 text-blue-500 animate-spin" />
                       </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700 backdrop-blur">
                    <p className="text-blue-400 font-medium text-sm animate-pulse">
                      A IA está trabalhando nesta versão...
                    </p>
                  </div>
               </div>
             ) : (
               <img 
                 src={activeImage} 
                 alt="Active Version" 
                 className="max-h-full max-w-full object-contain shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95" 
               />
             )}
          </div>

          {/* Timeline / Version History Strip */}
          <div className="h-32 bg-slate-900 border-t border-slate-800 flex flex-col shrink-0">
             <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Linha do Tempo da Sessão</span>
                <span>{versions.length} versões</span>
             </div>
             <div className="flex-1 overflow-x-auto custom-scrollbar px-4 pb-4 flex items-center gap-3">
                {versions.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => !isProcessing && setCurrentVersionIdx(idx)}
                    className={`relative group shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      currentVersionIdx === idx 
                      ? 'border-blue-500 ring-2 ring-blue-500/30 w-20 h-20' 
                      : 'border-slate-700 w-16 h-16 opacity-60 hover:opacity-100 hover:border-slate-500'
                    }`}
                  >
                    <img src={v.image} className="w-full h-full object-cover" alt="" />
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 bg-slate-900/80 text-[8px] text-white px-1">ORIG</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] text-white truncate px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {v.prompt}
                    </div>
                  </button>
                ))}
                
                {/* Visual Connector for 'Next Step' */}
                <div className="h-0.5 w-4 bg-slate-800 shrink-0"></div>
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 shrink-0">
                   <Icons.More className="w-4 h-4" />
                </div>
             </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-1/3 flex flex-col bg-slate-900 h-full border-l border-slate-800">
          
          {/* Header Controls */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
             <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Icons.Wand className="w-4 h-4 text-blue-500" />
                Estúdio de Criação
             </h2>
             <div className="flex gap-2">
               <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded hover:bg-slate-800">
                  <Icons.Close className="w-4 h-4" />
               </button>
               <button 
                  onClick={handleSaveAndClose}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"
               >
                  <Icons.Check className="w-3 h-3" />
                  Salvar Esta
               </button>
             </div>
          </div>

          {/* Category Tabs */}
          <div className="flex p-2 gap-2 border-b border-slate-800 bg-slate-900/50">
             <button 
               onClick={() => setActiveCategory('cleanup')}
               className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeCategory === 'cleanup' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
             >
               Tratamento
             </button>
             <button 
               onClick={() => setActiveCategory('style')}
               className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeCategory === 'style' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
             >
               Estilo
             </button>
             <button 
               onClick={() => setActiveCategory('marketing')}
               className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeCategory === 'marketing' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
             >
               Mkt
             </button>
          </div>

          {/* Scrollable Quick Actions Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-950/30">
             <div className="space-y-4">
               <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ações Rápidas</h3>
                  {renderQuickActions()}
               </div>
               
               <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-3">
                  <p className="text-[10px] text-blue-300 leading-relaxed">
                      <Icons.Zap className="w-3 h-3 inline mr-1" />
                      Dica: A IA processará a imagem com base na versão que você está visualizando no momento (chaining).
                  </p>
               </div>
             </div>
          </div>

          {/* Bottom Prompt Input */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 mb-2">Prompt Personalizado</h3>
            <form onSubmit={handleSubmit}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Adicionar borda dourada..."
                className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2"
              />
              
              {/* Robust Error Display with Details Toggle */}
              {error && (
                  <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs p-3 rounded mb-2">
                      <div className="flex items-start gap-2 font-semibold">
                          <Icons.Alert className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{error.message}</span>
                      </div>
                      <button 
                          type="button"
                          onClick={() => setShowErrorDetails(!showErrorDetails)}
                          className="mt-2 text-[10px] text-red-400/70 hover:text-red-300 underline"
                      >
                          {showErrorDetails ? "Ocultar detalhes técnicos" : "Ver detalhes do erro"}
                      </button>
                      {showErrorDetails && (
                          <pre className="mt-2 p-2 bg-red-950/50 rounded border border-red-900/30 text-[10px] font-mono whitespace-pre-wrap overflow-x-auto text-red-300">
                              {error.details}
                          </pre>
                      )}
                  </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isProcessing ? <Icons.Loader className="w-4 h-4 animate-spin" /> : "Gerar com IA"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
