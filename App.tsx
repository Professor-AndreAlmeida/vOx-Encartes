
import React, { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { ExtractionWorkspace } from './components/ExtractionWorkspace';
import { ProductEditor } from './components/ProductEditor';
import { Onboarding } from './components/Onboarding';
import { SettingsModal } from './components/SettingsModal';
import { Home } from './components/Home';
import { Icons } from './components/Icon';
import { ExtractedProduct, LeafletState } from './types';
import { identifyProductDetails } from './services/geminiService';
import { getAppState, getSettings, saveAppState, saveSettings } from './services/db';
import JSZip from 'jszip';

const generateId = () => Math.random().toString(36).substring(2, 9);

type AppScreen = 'loading' | 'home' | 'onboarding' | 'app';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [userName, setUserName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [leaflet, setLeaflet] = useState<LeafletState>({
    originalImage: null,
    products: [],
    isAnalyzing: false,
  });

  const [viewMode, setViewMode] = useState<'upload' | 'extract' | 'gallery'>('upload');
  const [editingProduct, setEditingProduct] = useState<ExtractedProduct | null>(null);

  // Initialize DB and Session with AUTO-FIX for Models
  useEffect(() => {
    const init = async () => {
      try {
        const settings = await getSettings();
        
        // AUTO-FIX: Corrigir especificamente o modelo Flash depreciado que causa Erro 429.
        // Verificamos a string exata para não alterar usuários que estão usando o PRO (que também contém 'preview' no nome).
        if (settings && settings.preferredModel === 'gemini-2.5-flash-preview-image') {
            console.log("Detectado modelo depreciado (Flash Preview). Atualizando para versão estável...");
            settings.preferredModel = 'gemini-2.5-flash-image';
            await saveSettings(settings);
        }

        if (settings && settings.apiKey) {
          setUserName(settings.name);
          
          // Load previous state
          const savedState = await getAppState();
          if (savedState) {
            setLeaflet(savedState);
            if (savedState.products.length > 0) {
              setViewMode('gallery');
            }
          }
          setScreen('app');
        } else {
          setScreen('home');
        }
      } catch (e) {
        console.error("Initialization error", e);
        setScreen('home');
      }
    };
    init();
  }, []);

  // Auto-save state on changes
  useEffect(() => {
    if (screen === 'app') {
      const saveTimer = setTimeout(() => {
        saveAppState(leaflet);
      }, 1000); // Debounce save
      return () => clearTimeout(saveTimer);
    }
  }, [leaflet, screen]);

  const handleLogout = () => {
    setLeaflet({ originalImage: null, products: [], isAnalyzing: false });
    setViewMode('upload');
    setScreen('home');
  };

  const handleOnboardingComplete = (name: string) => {
    setUserName(name);
    setScreen('app');
  };

  // 1. Handle Upload
  const handleImageSelected = (base64: string) => {
    setLeaflet(prev => ({ ...prev, originalImage: base64 }));
    setViewMode('extract');
  };

  // 2. Handle Manual Extraction from Canvas
  const handleExtract = async (cropBase64: string) => {
    // Create placeholder immediately
    const newProduct: ExtractedProduct = {
      id: generateId(),
      originalCrop: cropBase64,
      processedImage: null,
      name: "Analisando...",
      price: "...",
      status: 'pending',
      editHistory: []
    };

    setLeaflet(prev => ({
      ...prev,
      products: [newProduct, ...prev.products] // Add to top
    }));

    // Trigger basic analysis (OCR) in background
    try {
      const details = await identifyProductDetails(cropBase64);
      setLeaflet(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === newProduct.id ? { ...p, name: details.name, price: details.price, status: 'completed' } : p
        )
      }));
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Handle Update from Editor
  const handleProductUpdate = (id: string, newImage: string, promptUsed: string) => {
    setLeaflet(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          processedImage: newImage,
          editHistory: [...p.editHistory, promptUsed]
        };
      })
    }));
  };

  // 4. Update Metadata (Inline Edit)
  const handleMetadataUpdate = (id: string, field: 'name' | 'price', value: string) => {
      setLeaflet(prev => ({
          ...prev,
          products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
      }));
  };

  const handleDeleteProduct = (id: string) => {
    setLeaflet(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const handleDownload = (product: ExtractedProduct) => {
    const link = document.createElement('a');
    link.href = product.processedImage || product.originalCrop;
    link.download = `${product.name.replace(/\s+/g, '_')}_${product.price.replace(/[^0-9,]/g,'')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch ZIP Download
  const handleDownloadAll = async () => {
    if (leaflet.products.length === 0) return;
    
    const zip = new JSZip();
    const folder = zip.folder("vox_encartes_export");
    
    // Process each product
    leaflet.products.forEach((product) => {
        const imageSrc = product.processedImage || product.originalCrop;
        // Remove data:image/png;base64, prefix
        const base64Data = imageSrc.split(',')[1];
        if (base64Data && folder) {
             const filename = `${product.name.replace(/[^a-z0-9]/gi, '_').substring(0,30)}_${product.price.replace(/[^0-9,]/g,'')}.png`;
             folder.file(filename, base64Data, {base64: true});
        }
    });

    try {
        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vox_export_${new Date().toISOString().slice(0,10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Erro ao gerar ZIP", e);
        alert("Erro ao criar arquivo ZIP.");
    }
  };

  if (screen === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Icons.Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">Verificando dados locais...</p>
        </div>
      </div>
    );
  }

  if (screen === 'home') {
    return <Home onStart={() => setScreen('onboarding')} />;
  }

  if (screen === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Icons.Wand className="w-6 h-6" />
            <h1 className="font-bold text-lg tracking-tight text-slate-100">vOx Encartes</h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <p className="text-xs text-slate-500">Local-First • {userName}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setViewMode('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'upload' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Icons.Upload className="w-4 h-4" />
            Upload
          </button>
          <button 
             onClick={() => leaflet.originalImage && setViewMode('extract')}
             disabled={!leaflet.originalImage}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'extract' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} ${!leaflet.originalImage && 'opacity-50 cursor-not-allowed'}`}
          >
            <Icons.Scissors className="w-4 h-4" />
            Extrair e Segmentar
          </button>
          <button 
             onClick={() => leaflet.originalImage && setViewMode('gallery')}
             disabled={!leaflet.originalImage}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'gallery' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} ${!leaflet.originalImage && 'opacity-50 cursor-not-allowed'}`}
          >
            <Icons.Image className="w-4 h-4" />
            Galeria ({leaflet.products.length})
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
           <button 
             onClick={() => setShowSettings(true)}
             className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
           >
             <Icons.Settings className="w-4 h-4" />
             Configurações
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {viewMode === 'upload' && (
          <div className="h-full p-8 flex flex-col">
            <header className="mb-8">
              <h2 className="text-2xl font-bold text-slate-100">Upload do Encarte</h2>
              <p className="text-slate-400">Comece enviando um encarte de supermercado ou página de catálogo. Os dados ficam no seu dispositivo.</p>
            </header>
            <div className="flex-1">
              <UploadZone onImageSelected={handleImageSelected} />
            </div>
          </div>
        )}

        {viewMode === 'extract' && leaflet.originalImage && (
          <ExtractionWorkspace 
            imageSrc={leaflet.originalImage} 
            onExtract={handleExtract}
            onBack={() => setViewMode('upload')}
          />
        )}

        {viewMode === 'gallery' && (
          <div className="h-full p-8 flex flex-col overflow-hidden">
            <header className="mb-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Galeria de Produtos</h2>
                <p className="text-slate-400">Gerencie, edite e exporte seus produtos extraídos.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors"
                  onClick={handleDownloadAll}
                  title="Baixar tudo em ZIP"
                >
                  <Icons.Archive className="w-4 h-4" />
                  Baixar Pack (ZIP)
                </button>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-500 transition-colors"
                  onClick={() => setViewMode('extract')}
                >
                  <Icons.Scissors className="w-4 h-4" />
                  Extrair Mais
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
              {leaflet.products.length === 0 ? (
                 <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                    <Icons.Image className="w-8 h-8 mb-2 opacity-50" />
                    <p>Nenhum produto extraído ainda.</p>
                    <button onClick={() => setViewMode('extract')} className="text-blue-500 text-sm hover:underline mt-2">Ir para Modo de Extração</button>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {leaflet.products.map(product => (
                    <div key={product.id} className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden group hover:border-slate-600 transition-all">
                      <div className="aspect-square bg-slate-800 relative p-4 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                         <img 
                           src={product.processedImage || product.originalCrop} 
                           alt={product.name}
                           className="max-h-full max-w-full object-contain"
                         />
                         {product.processedImage && (
                           <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                             <Icons.Check className="w-3 h-3" />
                           </div>
                         )}
                         
                         {/* Hover Overlay */}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <button 
                              onClick={() => setEditingProduct(product)}
                              className="bg-slate-800 text-slate-200 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                              title="Editar com IA"
                            >
                              <Icons.Wand className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownload(product)}
                              className="bg-slate-800 text-slate-200 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                              title="Baixar"
                            >
                              <Icons.Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-slate-800 text-red-400 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                              title="Excluir"
                            >
                              <Icons.Trash className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                      
                      {/* Inline Editable Metadata */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                           <input 
                             type="text" 
                             value={product.name}
                             onChange={(e) => handleMetadataUpdate(product.id, 'name', e.target.value)}
                             className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-200 focus:ring-0 focus:border-b focus:border-blue-500 hover:text-white truncate"
                             placeholder="Nome do Produto"
                             title="Clique para editar"
                           />
                        </div>
                        <div className="flex justify-between items-center">
                           <input 
                             type="text" 
                             value={product.price}
                             onChange={(e) => handleMetadataUpdate(product.id, 'price', e.target.value)}
                             className="w-24 bg-transparent border-none p-0 text-lg font-bold text-blue-400 focus:ring-0 focus:border-b focus:border-blue-500"
                             placeholder="R$ 0,00"
                             title="Clique para editar preço"
                           />
                           <span className="text-xs text-slate-400 capitalize bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                             {product.status === 'pending' ? 'Analisando...' : 'Pronto'}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Editor Modal */}
      {editingProduct && (
        <ProductEditor 
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={handleProductUpdate}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
