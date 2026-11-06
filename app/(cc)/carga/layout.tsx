import type { ReactNode } from "react";
import "./carga.css";

export default function CargaLayout({ children }: { children: ReactNode }) {
  return <div className="carga-panel">{children}</div>;
}
