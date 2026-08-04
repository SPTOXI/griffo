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
  title: "GriffoWork — Global AI Career Intelligence",
  description: "Plataforma de Global AI Career Intelligence e otimização de presença digital baseada nos melhores padrões de recrutamento.",
  keywords: ["griffowork", "currículo", "resume ai", "cv audit", "global ai career intelligence", "ATS", "RH", "carreira", "griffo.work"],
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
    title: "GriffoWork — Global AI Career Intelligence",
    description: "Plataforma de Global AI Career Intelligence e otimização de presença digital baseada nos melhores padrões de recrutamento.",
    url: "https://griffo.work",
    siteName: "GriffoWork",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GriffoWork — Global AI Career Intelligence",
      },
    ],
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
