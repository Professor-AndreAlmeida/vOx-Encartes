import React, { useState } from 'react';
import { Icons } from './Icon';
import { saveSettings } from '../services/db';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    try {
      await saveSettings({
        name: name || 'Usuário',
        apiKey: apiKey.trim(),
        createdAt: Date.now()
      });
      onComplete(name || 'Usuário');
    } catch (error) {
      console.error("Erro ao salvar credenciais:", error);
      alert("Erro ao salvar configurações localmente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800 my-auto">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-900/30 p-4 rounded-full border border-blue-800/50">
            <Icons.Shield className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Bem-vindo ao vOx Encartes</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          Arquitetura Local-First. Seus dados, suas regras.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Seu Nome (Opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como quer ser chamado?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Google Gemini API Key</label>
            <div className="relative">
              <Icons.Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua chave AI Studio aqui"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-white placeholder-slate-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Nós não temos servidores. Sua chave é salva apenas no seu navegador (IndexedDB).
              <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">
                Obter chave (Google AI Studio)
              </a>
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!apiKey || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {loading ? <Icons.Loader className="w-5 h-5 animate-spin" /> : "Iniciar vOx Local"}
            </button>
          </div>
        </form>
        
        <div className="mt-6 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
            <Icons.Database className="w-3 h-3" />
            <span>Dados salvos localmente via IndexedDB</span>
          </div>
        </div>
      </div>
    </div>
  );
};