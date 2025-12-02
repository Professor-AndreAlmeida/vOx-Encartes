
import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';
import { getSettings, saveSettings, clearAllData, getAppState } from '../services/db';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash (Free Tier)',
    desc: 'Versão recomendada para a maioria das edições. Rápido e gratuito no Google AI Studio.',
    badge: 'Grátis e Rápido',
    cost: 'Gratuito (Tier Free)',
    type: 'flash'
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3.0 Pro (High Quality)',
    desc: 'Gera imagens com maior fidelidade e permite resolução 2K. Pode ter limite de uso menor.',
    badge: 'Pro / 2K Res',
    cost: 'Moderado (Rate Limit)',
    type: 'pro'
  }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onLogout }) => {
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [preferredModel, setPreferredModel] = useState('gemini-2.5-flash-image');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      if (s) {
        setApiKey(s.apiKey);
        setName(s.name);
        if (s.preferredModel) {
            // Safety check: If user had the text model selected previously, revert to flash-image
            if (s.preferredModel === 'gemini-2.5-flash') {
                setPreferredModel('gemini-2.5-flash-image');
            } else {
                setPreferredModel(s.preferredModel);
            }
        }
      }
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await saveSettings({
      name,
      apiKey,
      preferredModel,
      createdAt: Date.now() 
    });
    alert("Configurações salvas!");
    onClose();
  };

  const handleBackup = async () => {
    const state = await getAppState();
    const settings = await getSettings();
    const data = { settings, state, exportedAt: new Date().toISOString() };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vox-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (confirm("Tem certeza? Isso apagará TODAS as imagens e configurações deste navegador. Esta ação é irreversível.")) {
      await clearAllData();
      onLogout();
    }
  };

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Icons.Settings className="w-5 h-5" /> Configurações
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Perfil */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Perfil & Acesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome de Usuário</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-blue-500 outline-none"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">API Key (Google Gemini)</label>
                <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-white focus:ring-blue-500 outline-none"
                />
                </div>
            </div>
          </div>

          {/* Modelo IA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Icons.Cpu className="w-4 h-4" /> Modelo de Edição Visual
                </h3>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    Atualmente usando: {AVAILABLE_MODELS.find(m => m.id === preferredModel)?.name}
                </span>
            </div>
            
            <div className="grid gap-3">
                {AVAILABLE_MODELS.map((model) => (
                    <label 
                        key={model.id}
                        className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            preferredModel === model.id 
                            ? 'border-blue-500 bg-blue-900/10' 
                            : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
                        }`}
                    >
                        <input 
                            type="radio" 
                            name="model" 
                            value={model.id}
                            checked={preferredModel === model.id}
                            onChange={(e) => setPreferredModel(e.target.value)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-slate-200">{model.name}</span>
                                {model.badge && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                        preferredModel === model.id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        {model.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{model.desc}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Icons.Database className="w-3 h-3" />
                                <span>Disponibilidade: <strong className="text-slate-300">{model.cost}</strong></span>
                            </div>
                        </div>
                    </label>
                ))}
            </div>
            
            {/* Warning for PRO Models */}
            {preferredModel.includes('pro') && (
                <div className="p-3 bg-amber-900/20 border border-amber-900/50 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <Icons.Alert className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-400">Atenção ao Limite de Requisições</h4>
                        <p className="text-xs text-amber-200/80 mt-1">
                            O modelo Pro tem limites mais restritos no plano gratuito.
                            Se receber erros de "Cota Excedida", volte para o modelo Flash (Free Tier).
                        </p>
                    </div>
                </div>
            )}

            <p className="text-xs text-slate-500 mt-2 p-3 bg-slate-800/50 rounded border border-slate-800">
                <strong>Nota:</strong> O OCR (leitura de preços) continuará usando o <strong>Gemini 2.5 Flash</strong> automaticamente para economizar sua cota.
            </p>
          </div>

          {/* Dados */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Zona de Dados</h3>
            <div className="grid grid-cols-2 gap-3">
                <button 
                onClick={handleBackup}
                className="flex items-center justify-center gap-2 border border-slate-700 p-3 rounded-lg text-slate-300 hover:bg-slate-800 text-sm transition-colors"
                >
                <Icons.Download className="w-4 h-4" /> Backup JSON
                </button>
                <button 
                onClick={handleClearData}
                className="flex items-center justify-center gap-2 border border-red-900/50 text-red-400 p-3 rounded-lg hover:bg-red-900/20 text-sm transition-colors"
                >
                <Icons.Trash className="w-4 h-4" /> Resetar App
                </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-2 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 shadow-lg shadow-blue-900/20">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
