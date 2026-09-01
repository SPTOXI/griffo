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
  description: "Do perfil social à vaga certa: audite, alinhe e conquiste sua carreira com a Griffo IA. Laudo de currículo por IA em 8 dimensões e Radar de Vagas.",
  keywords: ["griffowork", "currículo", "resume ai", "cv audit", "global ai career intelligence", "ATS", "RH", "carreira", "griffo.work"],
  authors: [{ name: "GriffoWork" }],
  alternates: {
    canonical: "https://griffo.work",
    languages: {
      "pt-BR": "https://griffo.work/br",
      "en-US": "https://griffo.work/us",
      "es-ES": "https://griffo.work/es",
      "de-DE": "https://griffo.work/de",
      "fr-FR": "https://griffo.work/fr",
      "it-IT": "https://griffo.work/it",
      "ja-JP": "https://griffo.work/jp",
      "nl-NL": "https://griffo.work/nl",
      "sv-SE": "https://griffo.work/se",
      "zh-CN": "https://griffo.work/cn",
      "ar-AE": "https://griffo.work/ae",
      "ko-KR": "https://griffo.work/kr",
      // Fonte de verdade para tráfego sem correspondência de idioma/região:
      // a página global (sem preço/ATS de um país específico), não a raiz em pt-BR.
      "x-default": "https://griffo.work/global",
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
    description: "Do perfil social à vaga certa: audite, alinhe e conquiste sua carreira com a Griffo IA. Laudo de currículo por IA em 8 dimensões e Radar de Vagas.",
    url: "https://griffo.work",
    siteName: "GriffoWork",
    images: [
      {
        url: "/logo-full.png",
        width: 693,
        height: 694,
        alt: "GriffoWork — Global AI Career Intelligence",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GriffoWork — Análise de Currículo por IA",
    description: "Laudo profissional de currículo por IA em 8 dimensões executivas.",
    images: ['/logo-full.png'],
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
      "description": "Do perfil social à vaga certa: audite, alinhe e conquiste sua carreira com a Griffo IA. Laudo de currículo por IA em 8 dimensões e Radar de Vagas.",
      "inLanguage": ["pt-BR", "en-US", "es-ES", "de-DE", "fr-FR", "it-IT", "ja-JP", "nl-NL", "sv-SE", "zh-CN", "ar-AE", "ko-KR"]
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
        "email": "contact@griffo.work",
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
          "name": "Como funciona a verificação de compatibilidade com sistemas ATS (Gupy, Workday, Taleo)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nossa inteligência avalia a estrutura, legibilidade de seções, hierarquia de cabeçalhos e densidade de termos técnicos do seu documento segundo os critérios dos principais sistemas de triagem utilizados por grandes empresas."
          }
        },
        {
          "@type": "Question",
          "name": "A IA inventa informações ou experiências no meu currículo?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Não. O GriffoWork segue uma diretriz rígida de veracidade: mantemos 100% das suas empresas, cargos, datas e formação reais. A IA reestrutura a escrita para valorizar suas conquistas reais com o máximo de clareza e impacto."
          }
        },
        {
          "@type": "Question",
          "name": "Como funciona a otimização de perfis (LinkedIn, GitHub, Behance)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Se você fornecer os links dos seus perfis com sua autorização, geramos títulos otimizados (Headlines), resumos estratégicos e sugestões de posicionamento para atrair mais recrutadores no seu mercado."
          }
        },
        {
          "@type": "Question",
          "name": "Meus dados e meu currículo estão seguros?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Totalmente. Trabalhamos em conformidade rigorosa com a LGPD e GDPR. Seus dados são criptografados e nunca são compartilhados ou comercializados com terceiros."
          }
        },
        {
          "@type": "Question",
          "name": "Preciso assinar alguma coisa ou pagar mensalidade?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Não. Você paga uma única vez pela Análise Completa daquele currículo e recebe todas as entregas. Não há mensalidade, renovação automática nem saldo para administrar — transparência total."
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

