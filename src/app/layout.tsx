import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerLens - Análise de Currículo com IA",
  description: "Análise profissional de currículo com IA: nota 0-10 em 8 dimensões, pontos fortes e fracos, reescrita autorizada e download em PDF e Markdown. Baseado nas melhores práticas de RH e LinkedIn.",
  keywords: ["currículo", "análise de currículo", "ATS", "RH", "recrutamento", "LinkedIn", "carreira", "IA"],
  authors: [{ name: "CareerLens" }],
  openGraph: {
    title: "CareerLens - Análise de Currículo com IA",
    description: "Descubra o que seu currículo realmente diz sobre você. Laudo técnico 0-10, reescrita autorizada e download em PDF/MD.",
    siteName: "CareerLens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerLens - Análise de Currículo com IA",
    description: "Laudo profissional de currículo com nota 0-10 em 8 dimensões.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
