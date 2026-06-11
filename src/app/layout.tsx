import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Cavi Property Tracker",
  description: "Project management for Cavi Property development projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}
