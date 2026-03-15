import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prever — Descubra quanto você precisa para se aposentar",
  description: "Simule sua aposentadoria em 2 minutos. Combine INSS + investimentos e descubra exatamente quanto guardar por mês para viver bem no futuro.",
  keywords: "simulador aposentadoria, INSS, previdência privada, quanto preciso para me aposentar, planejamento financeiro",
  openGraph: {
    title: "Prever — Simule sua aposentadoria em 2 minutos",
    description: "Descubra quanto você precisa guardar por mês para ter a aposentadoria que merece.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#080C14" />
      </head>
      <body>{children}</body>
    </html>
  );
}
