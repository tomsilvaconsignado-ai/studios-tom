import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, Plus, Download, ImageIcon, LayoutTemplate, 
  Wand2, Upload, FileText, ChevronLeft, ChevronRight, 
  CheckCircle2, Trash2, X
} from 'lucide-react';

// Função para simular a API de geração de imagem (Google Flow)
const generateMockImage = async (prompt, styleReference) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      // Fundo escuro estilizado
      const hue = Math.floor(Math.random() * 360);
      ctx.fillStyle = `hsl(${hue}, 40%, 15%)`;
      ctx.fillRect(0, 0, 800, 800);
      
      // Efeito de meio-tom ou grade para dar um ar de quadrinho
      ctx.fillStyle = `hsl(${hue}, 50%, 25%)`;
      for(let i = 0; i < 800; i += 40) {
        for(let j = 0; j < 800; j += 40) {
          ctx.beginPath();
          ctx.arc(i, j, Math.random() * 5 + 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Adicionando formas baseadas na referência de estilo
      ctx.fillStyle = styleReference ? '#BB86FC' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(400, 200);
      ctx.lineTo(600, 600);
      ctx.lineTo(200, 600);
      ctx.closePath();
      ctx.fill();

      // Texto do prompt
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Google Flow Generation', 400, 350);
      
      ctx.font = 'italic 24px sans-serif';
      ctx.fillStyle = '#a1a1aa';
      const maxText = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;
      ctx.fillText(`"${maxText}"`, 400, 400);

      if (styleReference) {
        ctx.fillStyle = '#BB86FC';
        ctx.font = '18px sans-serif';
        ctx.fillText('✓ Estilo de personagem mantido', 400, 450);
      }

      resolve(canvas.toDataURL());
    }, 2500); // 2.5s de loading simulado
  });
};

const defaultPanel = { prompt: '', image: null, isLoading: false };

const getLayoutPanels = (layoutType) => {
  switch(layoutType) {
    case 1: return [{...defaultPanel, id: 1}];
    case 2: return [{...defaultPanel, id: 1}, {...defaultPanel, id: 2}];
    case 3: return [{...defaultPanel, id: 1}, {...defaultPanel, id: 2}, {...defaultPanel, id: 3}];
    case 4: return [{...defaultPanel, id: 1}, {...defaultPanel, id: 2}, {...defaultPanel, id: 3}, {...defaultPanel, id: 4}];
    default: return [{...defaultPanel, id: 1}];
  }
};

export default function StudiosTomApp() {
  const [stories, setStories] = useState([
    {
      id: 1,
      title: 'Edição #1: O Despertar',
      pages: [
        { id: 1, layout: 3, panels: getLayoutPanels(3) }
      ]
    }
  ]);
  
  const [activeStoryId, setActiveStoryId] = useState(1);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activePanelId, setActivePanelId] = useState(null);
  const [globalStyle, setGlobalStyle] = useState(null);
  
  // Toast System
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const activeStory = stories.find(s => s.id === activeStoryId);
  const activePage = activeStory?.pages[activePageIndex];
  const activePanel = activePage?.panels.find(p => p.id === activePanelId);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const createNewStory = () => {
    const newId = stories.length > 0 ? Math.max(...stories.map(s => s.id)) + 1 : 1;
    const newStory = {
      id: newId,
      title: `Nova Edição #${newId}`,
      pages: [{ id: 1, layout: 2, panels: getLayoutPanels(2) }]
    };
    setStories([...stories, newStory]);
    setActiveStoryId(newId);
    setActivePageIndex(0);
    setActivePanelId(null);
    showToast('Nova edição criada com sucesso.', 'success');
  };

  const addPage = () => {
    if (!activeStory) return;
    const newStories = [...stories];
    const storyIndex = newStories.findIndex(s => s.id === activeStoryId);
    const newPageId = newStories[storyIndex].pages.length + 1;
    newStories[storyIndex].pages.push({ id: newPageId, layout: 4, panels: getLayoutPanels(4) });
    setStories(newStories);
    setActivePageIndex(newStories[storyIndex].pages.length - 1);
    setActivePanelId(null);
  };

  const changeLayout = (layoutType) => {
    if (!activeStory || !activePage) return;
    const newStories = [...stories];
    const storyIndex = newStories.findIndex(s => s.id === activeStoryId);
    const newPanels = getLayoutPanels(layoutType);
    
    // Preserve content if possible
    activePage.panels.forEach((oldPanel, idx) => {
      if (newPanels[idx]) {
        newPanels[idx].prompt = oldPanel.prompt;
        newPanels[idx].image = oldPanel.image;
      }
    });

    newStories[storyIndex].pages[activePageIndex].layout = layoutType;
    newStories[storyIndex].pages[activePageIndex].panels = newPanels;
    setStories(newStories);
    setActivePanelId(null);
  };

  const handleGenerateImage = async () => {
    if (!activeStory || !activePanel) return;
    if (!activePanel.prompt.trim()) {
      showToast('Por favor, digite um prompt para a cena.', 'error');
      return;
    }

    // Set Loading State
    const setPanelLoading = (isLoading) => {
      const newStories = [...stories];
      const storyIndex = newStories.findIndex(s => s.id === activeStoryId);
      const panelIndex = newStories[storyIndex].pages[activePageIndex].panels.findIndex(p => p.id === activePanelId);
      newStories[storyIndex].pages[activePageIndex].panels[panelIndex].isLoading = isLoading;
      setStories(newStories);
    };

    setPanelLoading(true);
    showToast('Google Flow: Gerando cena...', 'info');

    // Simulate API Call
    const imageUrl = await generateMockImage(activePanel.prompt, globalStyle);

    // Set Image State
    const newStories = [...stories];
    const storyIndex = newStories.findIndex(s => s.id === activeStoryId);
    const panelIndex = newStories[storyIndex].pages[activePageIndex].panels.findIndex(p => p.id === activePanelId);
    newStories[storyIndex].pages[activePageIndex].panels[panelIndex].image = imageUrl;
    newStories[storyIndex].pages[activePageIndex].panels[panelIndex].isLoading = false;
    setStories(newStories);
    
    showToast('Imagem gerada com sucesso!', 'success');
  };

  const updatePanelPrompt = (text) => {
    if (!activeStory || !activePanel) return;
    const newStories = [...stories];
    const storyIndex = newStories.findIndex(s => s.id === activeStoryId);
    const panelIndex = newStories[storyIndex].pages[activePageIndex].panels.findIndex(p => p.id === activePanelId);
    newStories[storyIndex].pages[activePageIndex].panels[panelIndex].prompt = text;
    setStories(newStories);
  };

  const handleStyleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setGlobalStyle(url);
      showToast('Referência de estilo definida.', 'success');
    }
  };

  const simulateExportPDF = () => {
    showToast('Gerando PDF e preparando download...', 'info');
    setTimeout(() => {
      showToast('PDF Exportado com sucesso! (Simulação)', 'success');
    }, 2000);
  };

  const renderSidebar = () => (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
        <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/20">
          ST
        </div>
        <h1 className="font-bold text-xl tracking-tight text-zinc-100">Studios Tom</h1>
      </div>

      <div className="p-4">
        <button 
          onClick={createNewStory}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-lg transition-colors border border-zinc-700 font-medium text-sm"
        >
          <Plus size={18} />
          Criar Nova Edição
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">Minhas Histórias</h2>
        <div className="space-y-1">
          {stories.map(story => (
            <button
              key={story.id}
              onClick={() => { setActiveStoryId(story.id); setActivePageIndex(0); setActivePanelId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeStoryId === story.id 
                  ? 'bg-purple-600/10 text-purple-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Book size={18} className={activeStoryId === story.id ? 'text-purple-500' : 'text-zinc-500'} />
              <span className="truncate flex-1 text-sm">{story.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button 
          onClick={simulateExportPDF}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg transition-colors shadow-lg shadow-purple-600/20 font-medium text-sm"
        >
          <Download size={18} />
          Exportar Edição (PDF)
        </button>
      </div>
    </div>
  );

  const renderCanvas = () => {
    if (!activePage) return null;

    // Definição das classes de grid baseado no layout selecionado
    let gridClass = '';
    switch(activePage.layout) {
      case 1: gridClass = 'grid-cols-1 grid-rows-1'; break;
      case 2: gridClass = 'grid-cols-1 md:grid-cols-2 grid-rows-1'; break;
      case 3: gridClass = 'grid-cols-2 grid-rows-2'; break;
      case 4: gridClass = 'grid-cols-2 grid-rows-2'; break;
      default: gridClass = 'grid-cols-1';
    }

    return (
      <div className="flex-1 bg-zinc-950 overflow-y-auto flex flex-col items-center py-10 px-4 relative">
        
        {/* Navegação e Título da Página Superior */}
        <div className="w-full max-w-[800px] mb-6 flex justify-between items-center text-zinc-400">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileText size={20} className="text-purple-500" />
            {activeStory?.title}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setActivePageIndex(Math.max(0, activePageIndex - 1)); setActivePanelId(null); }}
              disabled={activePageIndex === 0}
              className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">Página {activePageIndex + 1} de {activeStory?.pages.length}</span>
            <button 
              onClick={() => {
                if (activePageIndex < activeStory.pages.length - 1) {
                  setActivePageIndex(activePageIndex + 1);
                  setActivePanelId(null);
                } else {
                  addPage();
                }
              }}
              className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
              title={activePageIndex < activeStory.pages.length - 1 ? "Próxima página" : "Adicionar nova página"}
            >
               {activePageIndex < activeStory.pages.length - 1 ? <ChevronRight size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>

        {/* O Canvas da Página (Proporção estilo A4) */}
        <div className="w-full max-w-[800px] aspect-[1/1.414] bg-white rounded-sm shadow-2xl p-4 md:p-6 ring-1 ring-zinc-800/50 flex flex-col relative">
          
          <div className={`flex-1 grid ${gridClass} gap-3 md:gap-4`}>
            {activePage.panels.map((panel, index) => {
              // Lógica customizada para layout 3 (primeiro painel ocupa 2 colunas na grid de 2x2)
              const isLayout3LargePanel = activePage.layout === 3 && index === 0;
              
              return (
                <div 
                  key={panel.id}
                  onClick={() => setActivePanelId(panel.id)}
                  className={`
                    relative group cursor-pointer overflow-hidden border-[3px] border-zinc-900 bg-zinc-100 transition-all
                    ${isLayout3LargePanel ? 'col-span-2' : ''}
                    ${activePanelId === panel.id ? 'ring-4 ring-purple-500 shadow-xl scale-[1.01] z-10' : 'hover:border-zinc-500'}
                  `}
                >
                  {panel.image ? (
                    <img src={panel.image} alt={panel.prompt} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                      <ImageIcon size={32} className="opacity-50" />
                      <span className="text-sm font-medium">
                        {panel.prompt ? `Pronto para gerar` : `Painel ${index + 1}`}
                      </span>
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {panel.isLoading && (
                    <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <Wand2 size={32} className="animate-pulse text-purple-400 mb-3" />
                      <span className="text-sm font-medium animate-pulse">Google Flow processando...</span>
                    </div>
                  )}

                  {/* Active Indicator Overlay */}
                  {activePanelId === panel.id && !panel.isLoading && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Numeração de Página */}
          <div className="absolute bottom-2 right-4 text-zinc-400 text-xs font-bold">
            {activePageIndex + 1}
          </div>
        </div>
      </div>
    );
  };

  const renderRightPanel = () => (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-y-auto">
      
      {/* Layout Selection */}
      <div className="p-6 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <LayoutTemplate size={16} /> Layout da Página
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => changeLayout(num)}
              className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                activePage?.layout === num 
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="w-10 h-10 border-2 border-current rounded-sm opacity-80 grid gap-0.5 p-0.5">
                {num === 1 && <div className="bg-current rounded-[1px] w-full h-full" />}
                {num === 2 && <><div className="bg-current rounded-[1px] h-full"/><div className="bg-current rounded-[1px] h-full"/></>}
                {num === 3 && <><div className="bg-current rounded-[1px] col-span-2 h-full"/><div className="bg-current rounded-[1px] h-full"/><div className="bg-current rounded-[1px] h-full"/></>}
                {num === 4 && <><div className="bg-current rounded-[1px] h-full"/><div className="bg-current rounded-[1px] h-full"/><div className="bg-current rounded-[1px] h-full"/><div className="bg-current rounded-[1px] h-full"/></>}
              </div>
              <span className="text-xs font-medium">{num} Painéis</span>
            </button>
          ))}
        </div>
      </div>

      {/* Global Style Reference */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Referência de Traço</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Faça upload de um esboço ou personagem para manter a <span className="text-purple-400 font-medium">consistência visual</span> gerada pela IA entre todos os painéis.
        </p>
        
        {globalStyle ? (
          <div className="relative group rounded-lg overflow-hidden border border-zinc-700">
            <img src={globalStyle} alt="Estilo Global" className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setGlobalStyle(null)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg"
                title="Remover estilo"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 text-xs text-center py-1 text-purple-300 font-medium border-t border-purple-500/30">
              Estilo Ativo
            </div>
          </div>
        ) : (
          <label className="cursor-pointer border-2 border-dashed border-zinc-700 hover:border-purple-500 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 transition-all rounded-lg h-32 flex flex-col items-center justify-center gap-2">
            <Upload size={24} />
            <span className="text-sm font-medium">Upload da Arte</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleStyleUpload} />
          </label>
        )}
      </div>

      {/* Editor do Painel Selecionado */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wand2 size={16} /> Gerador de Cena
        </h3>
        
        {!activePanelId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 gap-3 border border-dashed border-zinc-800 rounded-lg p-6 bg-zinc-800/20">
            <LayoutTemplate size={32} className="opacity-50" />
            <p className="text-sm">Selecione um painel na página para editar a cena.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Prompt Descritivo (Google Flow)</label>
            <textarea 
              value={activePanel?.prompt || ''}
              onChange={(e) => updatePanelPrompt(e.target.value)}
              placeholder="Ex: Personagem caminhando em uma rua chuvosa, perspectiva de baixo, alto contraste, estilo noir..."
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none mb-4"
            />
            
            {globalStyle && (
               <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 p-2 rounded border border-purple-500/20 mb-4">
                 <CheckCircle2 size={14} />
                 Consistência de traço ativada
               </div>
            )}

            <button 
              onClick={handleGenerateImage}
              disabled={activePanel?.isLoading || !activePanel?.prompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 mt-auto"
            >
              <Wand2 size={18} />
              {activePanel?.isLoading ? 'Gerando...' : 'Gerar Imagem'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-200 flex font-sans overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4 text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-500 text-white' : 
            toast.type === 'error' ? 'bg-red-500 text-white' : 
            'bg-zinc-800 border border-zinc-700 text-zinc-200'}`}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {renderSidebar()}
      {renderCanvas()}
      {renderRightPanel()}
    </div>
  );
}
