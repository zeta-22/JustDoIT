import type { ReactNode } from "react";
import Thumb from "./Thumb";

/** Stato vuoto con l'Atleta flat al posto di un'icona: dice cosa comparirà qui e come iniziare. */
export default function Empty({ fig, title, text, children }: { fig: string; title: string; text?: string; children?: ReactNode }) {
  return <div className="empty"><Thumb ex={fig} className="xl" /><p><b>{title}</b></p>{text && <p className="small muted">{text}</p>}{children}</div>;
}
