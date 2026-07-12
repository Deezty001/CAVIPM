import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cavi Projects — Development Intelligence",
  description: "A unified workspace for property development delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className="font-sans antialiased">
        <Nav />
        <main className="min-h-screen pt-[72px]">{children}</main>
      </body>
    </html>
  );
}
