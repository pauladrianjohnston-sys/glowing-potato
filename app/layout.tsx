import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinite Canvas App",
  description: "An infinite creative canvas with drawing, shapes, text, and images",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
