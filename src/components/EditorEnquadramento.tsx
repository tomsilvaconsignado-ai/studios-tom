import { Focus, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Enquadramento } from "@/lib/db";
import { ENQUADRAMENTO_ORIGINAL } from "@/lib/enquadramento";

export function EditorEnquadramento({ valor = ENQUADRAMENTO_ORIGINAL, ativo, onAtivo, onAlterar }: {
  valor?: Enquadramento; ativo: boolean; onAtivo: (v: boolean) => void; onAlterar: (v: Enquadramento) => void;
}) {
  const zoom = (n: number) => onAlterar({ ...valor, zoom: Math.max(25, Math.min(400, n)) });
  return <section className="space-y-2 border-t-2 pt-3" aria-label="Enquadramento da imagem">
    <h4 className="font-bold">Enquadramento</h4>
    <Button variant="outline" className={`w-full ${ativo ? "bg-highlight" : ""}`} aria-pressed={ativo} onClick={() => onAtivo(!ativo)}><Move />Ajustar imagem</Button>
    <label className="block text-xs font-semibold">Zoom: {valor.zoom}%<input aria-label="Zoom do painel" className="w-full accent-primary" type="range" min="25" max="400" value={valor.zoom} onChange={(e) => zoom(Number(e.target.value))} /></label>
    <div className="flex gap-2"><Button variant="outline" size="icon" title="Diminuir imagem" aria-label="Diminuir imagem" onClick={() => zoom(valor.zoom - 10)}><ZoomOut /></Button><Button variant="outline" size="icon" title="Aumentar imagem" aria-label="Aumentar imagem" onClick={() => zoom(valor.zoom + 10)}><ZoomIn /></Button><Button variant="outline" size="icon" title="Centralizar imagem" aria-label="Centralizar imagem" onClick={() => onAlterar({ ...valor, x: 0, y: 0 })}><Focus /></Button><Button variant="outline" size="icon" title="Restaurar enquadramento" aria-label="Restaurar enquadramento" onClick={() => onAlterar({ ...ENQUADRAMENTO_ORIGINAL })}><RotateCcw /></Button></div>
    <div className="grid grid-cols-2 gap-2">{(["x", "y"] as const).map((eixo) => <label key={eixo} className="text-xs font-semibold">{eixo.toUpperCase()} (%)<input aria-label={`Enquadramento ${eixo.toUpperCase()}`} className="comic-input" type="number" min="-100" max="100" value={valor[eixo]} onChange={(e) => onAlterar({ ...valor, [eixo]: Math.max(-100, Math.min(100, Number(e.target.value))) })} /></label>)}</div>
    <select aria-label="Modo de enquadramento" className="comic-input" value={valor.ajuste} onChange={(e) => onAlterar({ ...valor, ajuste: e.target.value as Enquadramento["ajuste"] })}><option value="conter">Imagem inteira</option><option value="preencher">Preencher / recortar</option></select>
  </section>;
}