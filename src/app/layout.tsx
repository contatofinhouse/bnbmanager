import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bnbmanager | Relatório de Gestão e Receitas - Edifício Copan",
  description: "Controle Operacional e Financeiro (DRE) - Copan 4 Cotistas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-200">
        {children}
      </body>
    </html>
  );
}
