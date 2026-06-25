import type { Metadata } from "next";
import "../index.css";
import "../App.css";

export const metadata: Metadata = {
  title: "tryagentscore.com | AI Search Visibility Score",
  description: "Find out if AI search is recommending your business.",
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
      </body>
    </html>
  );
}
