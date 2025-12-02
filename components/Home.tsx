import React from 'react';
import { Icons } from './Icon';

interface HomeProps {
  onStart: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Icons.Wand className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="font-bold tracking-tight text-lg leading-none">vOx <span className="hidden sm:inline">Encartes</span></span>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-medium uppercase tracking-wider whitespace-nowrap">
              Open Source
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a 
              href="https://github.com/Professor-AndreAlmeida/vOx-Encartes" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Icons.Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16 w-full flex flex-col justify-center">
        
        {/* Hero Section */}
        <div className="space-y-6 mb-12 md:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <Icons.CheckCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">Ambiente Configurado com Sucesso</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Seu Laboratório de Encartes <br className="hidden sm:block" />
            <span className="text-blue-500">Instalado e Pronto.</span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Você está rodando a versão <strong>Open Source</strong> do vOx Encartes. Todo o poder da IA do Google Gemini, 
            rodando diretamente no seu navegador, sem servidores intermediários e com total privacidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full sm:w-auto">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Acessar Sistema
              <Icons.Wand className="w-4 h-4" />
            </button>
            <a 
              href="https://aistudio.google.com/app/api-keys"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:border-slate-500"
            >
              <Icons.Key className="w-4 h-4 text-slate-400" />
              Gerar API Key
            </a>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 border-t border-slate-800 pt-12">
          
          {/* Left Column: Privacy & Architecture */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Icons.Shield className="w-5 h-5 text-blue-500" />
              Como seus dados funcionam?
            </h2>

            <div className="space-y-6">
              <div className="pl-4 border-l-2 border-slate-800">
                <h3 className="font-semibold text-slate-200 mb-1 text-sm md:text-base">Arquitetura Local-First</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  O vOx foi construído seguindo a filosofia Local-First. Isso significa que 
                  <strong> não possuímos um banco de dados na nuvem</strong> para armazenar suas imagens.
                  Tudo fica salvo no seu dispositivo.
                </p>
              </div>

              <div className="pl-4 border-l-2 border-slate-800">
                <h3 className="font-semibold text-slate-200 mb-1 text-sm md:text-base">Persistência via IndexedDB</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Utilizamos o IndexedDB, um banco de dados poderoso dentro do seu navegador, para salvar seus encartes, recortes e configurações.
                </p>
                <div className="mt-3 flex gap-3 bg-amber-900/20 p-3 rounded border border-amber-900/30">
                   <Icons.Alert className="w-5 h-5 text-amber-500 shrink-0" />
                   <p className="text-xs text-amber-200/80 leading-snug">
                     Atenção: Se você limpar os dados do navegador ou abrir em janela anônima, seus dados não estarão lá. Use a opção de Backup nas configurações.
                   </p>
                </div>
              </div>

              <div className="pl-4 border-l-2 border-slate-800">
                <h3 className="font-semibold text-slate-200 mb-1 text-sm md:text-base">Modelo BYOK</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Para manter o projeto 100% gratuito e open-source, não cobramos assinatura. Você utiliza sua própria API Key do Google Gemini.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Compatibility & Community */}
          <div className="space-y-8 md:space-y-10">
            
            {/* Compatibility */}
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Icons.Globe className="w-5 h-5 text-blue-500" />
                Compatibilidade
              </h2>
              
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                    <span className="text-sm font-medium text-slate-200">Google Chrome</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded w-fit">Recomendado</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                    <span className="text-sm font-medium text-slate-200">Edge / Brave / Opera</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded w-fit">Total Suporte</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                    <span className="text-sm font-medium text-slate-200">Firefox / Safari</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded w-fit">Experimental</span>
                </div>
              </div>
            </div>

            {/* Bugs / Contribute */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Icons.Bug className="w-4 h-4 text-slate-400" />
                Bug ou Sugestão?
              </h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Este é um projeto colaborativo em constante evolução. Sua contribuição é essencial.
              </p>
              <a 
                href="https://github.com/Professor-AndreAlmeida/vOx-Encartes/issues" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                Reportar no GitHub <Icons.Github className="w-3 h-3" />
              </a>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">vOx Encartes</span> • v1.0.0
          </div>
          <div className="text-center md:text-right">
            <p>© 2025 <a href="https://github.com/Professor-AndreAlmeida" className="hover:text-blue-400 transition-colors">Prof. André Almeida</a>.</p>
            <p className="text-xs mt-1 text-slate-600">Distribuído sob licença MIT.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};