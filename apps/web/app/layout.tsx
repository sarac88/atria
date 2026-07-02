import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SettingsProvider } from "@/components/settings/SettingsContext";

export const metadata: Metadata = {
  title: "Atria LMS — Plataforma",
  description:
    "Plataforma de gestión del aprendizaje: clases, tareas, entregas, calificación y comunicación.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <SettingsProvider>{children}</SettingsProvider>
        </Providers>
      </body>
    </html>
  );
}
