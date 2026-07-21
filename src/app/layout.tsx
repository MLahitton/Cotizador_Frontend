import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cotizador | Steel and Glass",
  description: "Plataforma interna de cotización de Steel and Glass.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}