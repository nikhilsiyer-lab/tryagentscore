import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "../index.css";
import "../App.css";

export const metadata: Metadata = {
  title: "Global AI Visibility Score | AgentScore",
  description: "Get expert insights with AI Visibility Score by AgentScore, a pioneering SaaS solution. Analyze AI recommendations and unlock global growth potential.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Is AI search recommending your business?",
    description: "Run 14 AI citation tests on your website in 30 seconds. See your score, find gaps, and get a plain-English fix plan. Free.",
    url: "https://tryagentscore.com",
    siteName: "AgentScore",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AgentScore - The #1 tool to measure your business visibility across AI search engines",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Is AI search recommending your business?",
    description: "Get your AI visibility score in 30 seconds. Free, no sign-up.",
  },
  metadataBase: new URL("https://tryagentscore.com"),
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light-theme">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "AgentScore",
              "description": "AI visibility and citation tool in Berlin",
              "url": "https://tryagentscore.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Berlin"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "position": 1,
                    "itemOffered": {
                      "@type": "Service",
                      "name": "AI visibility score"
                    }
                  },
                  {
                    "@type": "Offer",
                    "position": 2,
                    "itemOffered": {
                      "@type": "Service",
                      "name": "AI citation analysis"
                    }
                  },
                  {
                    "@type": "Offer",
                    "position": 3,
                    "itemOffered": {
                      "@type": "Service",
                      "name": "ChatGPT visibility analysis"
                    }
                  },
                  {
                    "@type": "Offer",
                    "position": 4,
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Gemini visibility analysis"
                    }
                  },
                  {
                    "@type": "Offer",
                    "position": 5,
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Perplexity visibility analysis"
                    }
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
