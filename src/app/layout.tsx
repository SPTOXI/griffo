import type { Metadata } from "next";
import { rootHreflang, declaredLocales } from "@/lib/i18n/hreflang";
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
    // Os 12 pares + `x-default` saem de `lib/i18n/hreflang.ts`, cobertos por
    // teste. Enquanto viviam escritos aqui, nada obrigava um idioma novo a
    // aparecer neste bloco — e hreflang que não fecha é descartado inteiro
    // pelo Google (§2.69).
    languages: rootHreflang(),
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
      "inLanguage": declaredLocales()
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
      },
      "subOrganization": [
        { "@id": "https://griffo.work/enterprise#organization" }
      ]
    },
    {
      // Griffo Enterprise (B2B) como sub-organização da GriffoWork, não uma
      // marca solta: mesma entidade legal, produto separado para recrutador/
      // RH. Sem `logo`/`contactPoint` próprios de propósito — herdam da
      // organização-mãe acima via `parentOrganization`, para não duplicar.
      "@type": "Organization",
      "@id": "https://griffo.work/enterprise#organization",
      "name": "Griffo Enterprise",
      "url": "https://griffo.work/enterprise",
      "parentOrganization": { "@id": "https://griffo.work/#organization" }
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
      "description": "AI-powered resume audit across 8 executive dimensions, ATS optimization, and global professional presence.",
      "featureList": [
        "ATS diagnostics for Workday, Taleo, Greenhouse, Lever and Gupy",
        "Audit across 8 executive dimensions",
        "AI-powered resume rewrite and career orientation",
        "Social presence optimization on LinkedIn and GitHub",
        "Smart job radar and compatibility matching"
      ]
    }
  ]
};

// FAQPage removida daqui de propósito: este layout raiz é comum a TODAS as
// rotas/idiomas, e o schema.org exige que o FAQPage descreva o texto
// visível na própria página. Uma pergunta fixa em português nesta posição
// vazava para /us, /de, /jp etc. — cada rota país gera a sua própria
// FAQPage no idioma correto em `[country]/page.tsx`.

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

