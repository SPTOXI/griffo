import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Sonner, e não `ui/toaster`. Os dois chegaram a existir no projeto, mas o
// montado era o do Radix — cujo estado vinha de `useToast()`, que NENHUM
// arquivo chamava. As telas que avisam algo importam `toast` do sonner, e o
// sonner só renderiza se o `<Toaster />` dele estiver na árvore.
//
// O efeito era um aplicativo mudo: erro de pagamento, falha de upload, saldo
// insuficiente — tudo era reportado por uma chamada que não tinha onde
// aparecer. Para o usuário, clicar simplesmente não fazia nada.
//
// `ui/toaster.tsx` e `hooks/use-toast.ts` (o par do Radix, nunca montado)
// foram removidos em 27/08/2026 — código morto confirmado, zero import em
// qualquer lugar do projeto além deles mesmos.
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/context/i18n-context";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://griffo.work"),
  title: "GriffoWork — Global AI Career Intelligence",
  description: "Plataforma de Global AI Career Intelligence e otimização de presença digital baseada nos melhores padrões de recrutamento.",
  keywords: ["griffowork", "currículo", "resume ai", "cv audit", "global ai career intelligence", "ATS", "RH", "carreira", "griffo.work"],
  authors: [{ name: "GriffoWork" }],
  alternates: {
    canonical: "https://griffo.work",
    languages: {
      "pt-BR": "https://griffo.work?lang=pt",
      "en-US": "https://griffo.work?lang=en",
      "es-ES": "https://griffo.work?lang=es",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://griffo.work/#website",
      "url": "https://griffo.work",
      "name": "GriffoWork",
      "description": "Plataforma de Global AI Career Intelligence e otimização de presença digital baseada nos melhores padrões de recrutamento.",
      "inLanguage": ["pt-BR", "en-US", "es"]
    },
    {
      "@type": "Organization",
      "@id": "https://griffo.work/#organization",
      "name": "GriffoWork",
      "url": "https://griffo.work",
      "logo": "https://griffo.work/logo.png",
      "sameAs": [
        "https://www.instagram.com/griffowork"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "contato@griffo.work",
        "contactType": "customer service"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://griffo.work/#application",
      "name": "GriffoWork",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free executive resume preview and AI career intelligence audit"
      },
      "description": "Laudo profissional de currículo por IA em 8 dimensões executivas, otimização de ATS e presença profissional global.",
      "featureList": [
        "Diagnóstico de ATS para Workday, Taleo, Greenhouse, Lever e Gupy",
        "Análise em 8 dimensões executivas",
        "Reescrita e orientação de carreira por IA",
        "Otimização de presença social no LinkedIn e GitHub",
        "Radar inteligente de vagas e compatibilidade"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://griffo.work/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Como funciona o laudo profissional de currículo por IA?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nossa IA avalia seu currículo em 8 dimensões executivas críticas (impacto, clareza, alinhamento ATS, liderança, métricas e competências) e gera um relatório detalhado com plano de ação imediato."
          }
        },
        {
          "@type": "Question",
          "name": "O que é pontuação ATS e por que ela importa?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sistemas de Rastreamento de Candidatos (ATS) como Workday, Taleo e Greenhouse filtram mais de 70% dos currículos antes do olhar humano. O GriffoWork simula esses algoritmos para garantir que seu perfil chegue aos recrutadores."
          }
        },
        {
          "@type": "Question",
          "name": "Meus dados e meu currículo estão seguros?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sim. Seguimos rigorosamente a LGPD e GDPR. Seus documentos são criptografados e não são utilizados para treinar modelos públicos de IA sem o seu consentimento explícito."
          }
        },
        {
          "@type": "Question",
          "name": "A ferramenta suporta processos seletivos internacionais?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sim. A inteligência do GriffoWork adapta terminologias, formatações e métricas para padrões dos EUA, Europa, América Latina e mercados globais."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <I18nProvider>
          <PageViewTracker />
          {children}
          <Toaster position="top-center" richColors closeButton />
        </I18nProvider>
      </body>
    </html>
  );
}

