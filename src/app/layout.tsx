import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "../index.css";
import "../App.css";

export const metadata: Metadata = {
  title: "tryagentscore - Is AI recommending your business?",
  description: "Find out if ChatGPT, Gemini, and Perplexity are recommending your business. Get your AI visibility score in 30 seconds - free, no sign-up.",
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
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
