import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCF Compréhension Orale — Practice",
  description: "TCF listening test practice with YouTube audio and AI-generated questions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
