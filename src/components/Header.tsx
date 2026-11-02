import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Revistas" },
  { to: "/personagens", label: "Banco de Personagens" },
  { to: "/biblioteca", label: "Biblioteca" },
  { to: "/estilos", label: "Meus Estilos" },
] as const;

export function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b-2 bg-highlight px-4">
      <Link to="/" className="font-display text-2xl italic">
        STUDIOS <span className="text-primary">TOM</span>
      </Link>
      <nav className="flex gap-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="border-2 border-transparent px-3 py-1 text-sm font-semibold"
            activeProps={{ className: "!border-foreground bg-card comic-shadow" }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </header>
  );
}
