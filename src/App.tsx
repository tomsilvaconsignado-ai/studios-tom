import React, { useState } from 'react';
import {
  Book, Plus, Download, ImageIcon, LayoutTemplate,
  Wand2, Upload, FileText, ChevronLeft, ChevronRight,
  CheckCircle2, Trash2
} from 'lucide-react';

const generateMockImage = async (prompt: string, styleReference?: string | null) => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve('');
        return;
      }

      const hue = Math.floor(Math.random() * 360);
      ctx.fillStyle = `hsl(${hue}, 40%, 15%)`;
      ctx.fillRect(0, 0, 800, 800);

      ctx.fillStyle = `hsl(${hue}, 50%, 25%)`;
      for (let i = 0; i < 800; i += 40) {
        for (let j = 0; j < 800; j += 40) {
          ctx.beginPath();
          ctx.arc(i, j, Math.random() * 5 + 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = styleReference ? '#BB86FC' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(400, 200);
      ctx.lineTo(600, 600);
      ctx.lineTo(200, 600);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Google Flow Generation', 400, 350);

      ctx.font = 'italic 24px sans-serif';
      ctx.fillStyle = '#a1a1aa';
      const maxText = prompt.length > 40 ? `${prompt.substring(0, 40)}...` : prompt;
      ctx.fillText(`"${maxText}"`, 400, 400);

      if (styleReference) {
        ctx.fillStyle = '#BB86FC';
        ctx.font = '18px sans-serif';
        ctx.fillText('✓ Estilo de personagem mantido', 400, 450);
      }

      resolve(canvas.toDataURL());
    }, 2500);
  });
};

const defaultPanel = { prompt: '', image: null as string | null, isLoading: false };

const getLayoutPanels = (layoutType: number) => {
  switch (layoutType) {
    case 1:
      return [{ ...defaultPanel, id: 1 }];
    case 2:
      return [{ ...defaultPanel, id: 1 }, { ...defaultPanel, id: 2 }];
    case 3:
      return [{ ...defaultPanel, id: 1 }, { ...defaultPanel, id: 2 }, { ...defaultPanel, id: 3 }];
    case 4:
      return [{ ...defaultPanel, id: 1 }, { ...defaultPanel, id: 2 }, { ...defaultPanel, id: 3 }, { ...defaultPanel, id: 4 }];
    default:
      return [{ ...defaultPanel, id: 1 }];
  }
};

export default function App() {
  const [stories, setStories] = useState([
    {
      id: 1,
      title: 'Edição #1: O Despertar',
      pages: [{ id: 1, layout: 3, panels: getLayoutPanels(3) }],
    },
  ]);

  const [activeStoryId, setActiveStoryId] = useState(1);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activePanelId, setActivePanelId] = useState<number | null>(null);
  const [globalStyle, setGlobalStyle] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'info' | 'success' | 'error' });

  const activeStory = stories.find((s) => s.id === activeStoryId);
  const activePage = activeStory?.pages[activePageIndex];
  const activePanel = activePage?.panels.find((p) => p.id === activePanelId);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const createNewStory = () => {
    const newId = stories.length > 0 ? Math.max(...stories.map((s) => s.id)) + 1 : 1;
    const newStory = {
      id: newId,
      title: `Nova Edição #${newId}`,
      pages: [{ id: 1, layout: 2, panels: getLayoutPanels(2) }],
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
    const storyIndex = newStories.findIndex((s) => s.id === activeStoryId);
    const newPageId = newStories[storyIndex].pages.length + 1;
    newStories[storyIndex].pages.push({ id: newPageId, layout: 4, panels: getLayoutPanels(4) });
    setStories(newStories);
    setActivePageIndex(newStories[storyIndex].pages.length - 1);
    setActivePanelId(null);
  };

  const changeLayout = (layoutType: number) => {
    if (!activeStory || !activePage) return;
    const newStories = [...stories];
    const storyIndex = newStories.findIndex((s) => s.id === activeStoryId);
    const newPanels = getLayoutPanels(layoutType);

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

    const setPanelLoading = (isLoading: boolean) => {
      const newStories = [...stories];
      const storyIndex = newStories.findIndex((s) => s.id === activeStoryId);
      const panelIndex = newStories[storyIndex].pages[activePageIndex].panels.findIndex((p) => p.id === activePanelId);
      newStories[storyIndex].pages[activePageIndex].panels[panelIndex].isLoading = isLoading;
      setStories(newStories);
    };

    setPanelLoading(true);
    showToast('Google Flow: Gerando cena...', 'info');

    const imageUrl = await generateMockImage(activePanel.prompt, globalStyle);

    const newStories = [...stories];
    const storyIndex = newStories.findIndex((s) => s.id === activeStoryId);
    const panelIndex = newStories[storyIndex].pages[activePageIndex].panels.findIndex((p) => p.id === activePanelId);
    newStories[storyIndex].pages[activePageIndex].panels[panelIndex].image = imageUrl;
    newStories[storyIndex].pages[activePageIndex].panels[panelIndex].isLoading = false;
    setStories(newStories);

    showToast('Imagem gerada com sucesso!', 'success');
  };

  const updatePanelPrompt = (text: string) => {
    if (!activeStory || !activePanel) return;
    const newStories = [...stories];
    const storyIndex = newStories.findIndex((s) => s.id === activeStoryId);
    const panelIndex = newStories[storyIndex].pages[activePageIndex].panels.findIndex((p) => p.id === activePanelId);
    newStories[storyIndex].pages[activePageIndex].panels[panelIndex].prompt = text;
    setStories(newStories);
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-zinc-800 p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-600 font-bold text-white shadow-lg shadow-purple-600/20">
          ST
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Studios Tom</h1>
      </div>

      <div className="p-4">
        <button
          onClick={createNewStory}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus size={18} />
          Criar Nova Edição
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Minhas Histórias</h2>
        <div className="space-y-1">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => {
                setActiveStoryId(story.id);
                setActivePageIndex(0);
                setActivePanelId(null);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                activeStoryId === story.id ? 'bg-purple-600/10 font-medium text-purple-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Book size={18} className={activeStoryId === story.id ? 'text-purple-500' : 'text-zinc-500'} />
              <span className="flex-1 truncate text-sm">{story.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800 p-4">
        <button
          onClick={simulateExportPDF}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-600/20 transition-colors hover:bg-purple-500"
        >
          <Download size={18} />
          Exportar Edição (PDF)
        </button>
      </div>
    </div>
  );

  const renderCanvas = () => {
    if (!activePage) return null;

    let gridClass = '';
    switch (activePage.layout) {
      case 1:
        gridClass = 'grid-cols-1 grid-rows-1';
        break;
      case 2:
        gridClass = 'grid-cols-1 md:grid-cols-2 grid-rows-1';
        break;
      case 3:
        gridClass = 'grid-cols-2 grid-rows-2';
        break;
      case 4:
        gridClass = 'grid-cols-2 grid-rows-2';
        break;
      default:
        gridClass = 'grid-cols-1';
    }

    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto bg-zinc-950 px-4 py-10">
        <div className="mb-6 flex w-full max-w-[800px] items-center justify-between text-zinc-400">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <FileText size={20} className="text-purple-500" />
            {activeStory?.title}
          </h2>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActivePageIndex(Math.max(0, activePageIndex - 1));
                setActivePanelId(null);
              }}
              disabled={activePageIndex === 0}
              className="rounded-md p-1.5 transition-colors hover:bg-zinc-800 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">Página {activePageIndex + 1} de {activeStory?.pages.length}</span>
            <button
              onClick={() => {
                if (activePageIndex < (activeStory?.pages.length ?? 1) - 1) {
                  setActivePageIndex(activePageIndex + 1);
                  setActivePanelId(null);
                } else {
                  addPage();
                }
              }}
              className="rounded-md p-1.5 transition-colors hover:bg-zinc-800"
              title={activePageIndex < (activeStory?.pages.length ?? 1) - 1 ? 'Próxima página' : 'Adicionar nova página'}
            >
              {activePageIndex < (activeStory?.pages.length ?? 1) - 1 ? <ChevronRight size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>

        <div className="relative flex aspect-[1/1.414] w-full max-w-[800px] flex-col rounded-sm bg-white p-4 shadow-2xl ring-1 ring-zinc-800/50 md:p-6">
          <div className={`grid flex-1 gap-3 md:gap-4 ${gridClass}`}>
            {activePage.panels.map((panel, index) => {
              const isLayout3LargePanel = activePage.layout === 3 && index === 0;

              return (
                <div
                  key={panel.id}
                  onClick={() => setActivePanelId(panel.id)}
                  className={`group relative cursor-pointer overflow-hidden border-[3px] border-zinc-900 bg-zinc-100 transition-all ${
                    isLayout3LargePanel ? 'col-span-2' : ''
                  } ${activePanelId === panel.id ? 'z-10 scale-[1.01] ring-4 ring-purple-500 shadow-xl' : 'hover:border-zinc-500'}`}
                >
                  {panel.image ? (
                    <img src={panel.image} alt={panel.prompt} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-zinc-400">
                      <ImageIcon size={32} className="opacity-50" />
                      <span className="text-sm font-medium">{panel.prompt ? 'Pronto para gerar' : `Painel ${index + 1}`}</span>
                    </div>
                  )}

                  {panel.isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 text-white backdrop-blur-sm">
                      <Wand2 size={32} className="mb-3 animate-pulse text-purple-400" />
                      <span className="animate-pulse text-sm font-medium">Google Flow processando...</span>
                    </div>
                  )}

                  {activePanelId === panel.id && !panel.isLoading && (
                    <div className="absolute right-2 top-2 rounded-full bg-purple-500 p-1 text-white shadow-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-2 right-4 text-xs font-bold text-zinc-400">{activePageIndex + 1}</div>
        </div>
      </div>
    );
  };

  const renderRightPanel = () => (
    <div className="flex h-full w-80 flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-100">
          <LayoutTemplate size={16} /> Layout da Página
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => changeLayout(num)}
              className={`rounded-lg border p-3 transition-colors ${
                activePage?.layout === num ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="grid h-10 w-10 gap-0.5 rounded-sm border-2 border-current p-0.5 opacity-80">
                {num === 1 && <div className="h-full w-full rounded-[1px] bg-current" />}
                {num === 2 && <><div className="h-full rounded-[1px] bg-current" /><div className="h-full rounded-[1px] bg-current" /></>}
                {num === 3 && <><div className="col-span-2 h-full rounded-[1px] bg-current" /><div className="h-full rounded-[1px] bg-current" /><div className="h-full rounded-[1px] bg-current" /></>}
                {num === 4 && <><div className="h-full rounded-[1px] bg-current" /><div className="h-full rounded-[1px] bg-current" /><div className="h-full rounded-[1px] bg-current" /><div className="h-full rounded-[1px] bg-current" /></>}
              </div>
              <span className="mt-2 block text-xs font-medium">{num} Painéis</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-zinc-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-100">Referência de Traço</h3>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-zinc-400">
          Faça upload de um esboço ou personagem para manter a <span className="font-medium text-purple-400">consistência visual</span> gerada pela IA entre todos os painéis.
        </p>

        {globalStyle ? (
          <div className="group relative overflow-hidden rounded-lg border border-zinc-700">
            <img src={globalStyle} alt="Estilo Global" className="h-32 w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setGlobalStyle(null)}
                className="rounded-full bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
                title="Remover estilo"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 border-t border-purple-500/30 bg-zinc-900/90 py-1 text-center text-xs font-medium text-purple-300">
              Estilo Ativo
            </div>
          </div>
        ) : (
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 text-zinc-400 transition-all hover:border-purple-500 hover:bg-zinc-800 hover:text-purple-400">
            <Upload size={24} />
            <span className="text-sm font-medium">Upload da Arte</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleStyleUpload} />
          </label>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-100">
          <Wand2 size={16} /> Gerador de Cena
        </h3>

        {!activePanelId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-800/20 p-6 text-center text-zinc-500">
            <LayoutTemplate size={32} className="opacity-50" />
            <p className="text-sm">Selecione um painel na página para editar a cena.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <label className="mb-2 block text-xs font-medium text-zinc-400">Prompt Descritivo (Google Flow)</label>
            <textarea
              value={activePanel?.prompt || ''}
              onChange={(e) => updatePanelPrompt(e.target.value)}
              placeholder="Ex: Personagem caminhando em uma rua chuvosa, perspectiva de baixo, alto contraste, estilo noir..."
              className="mb-4 h-32 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />

            {globalStyle && (
              <div className="mb-4 flex items-center gap-2 rounded border border-purple-500/20 bg-purple-500/10 p-2 text-xs text-purple-400">
                <CheckCircle2 size={14} />
                Consistência de traço ativada
              </div>
            )}

            <button
              onClick={handleGenerateImage}
              disabled={activePanel?.isLoading || !activePanel?.prompt.trim()}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-medium text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
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
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-200">
      {toast.show && (
        <div
          className={`absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl ${
            toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'border border-zinc-700 bg-zinc-800 text-zinc-200'
          }`}
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
