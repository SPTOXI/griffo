import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/context/i18n-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GriffoWork — Análise de Currículo por IA | Global Resume AI Audit",
  description: "Análise profissional de currículo com Inteligência Artificial em Português, Inglês e Espanhol: nota 0-10 em 8 dimensões executivas, otimização para ATS e reescrita estratégica.",
  keywords: ["griffowork", "currículo", "resume ai", "cv audit", "análise de currículo por IA", "ATS", "RH", "carreira", "griffo.work"],
  authors: [{ name: "GriffoWork" }],
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "GriffoWork — Análise de Currículo por IA | Global Resume AI Audit",
    description: "Análise profissional de currículo por IA em 8 dimensões executivas. Descubra sua nota ATS e destaque-se nas seleções globais.",
    siteName: "GriffoWork",
    url: "https://griffo.work",
    images: [{ url: '/logo.png', width: 1200, height: 1200, alt: 'GriffoWork Logo' }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GriffoWork — Análise de Currículo por IA",
    description: "Laudo profissional de currículo por IA em 8 dimensões executivas.",
    images: ['/logo.png'],
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
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
