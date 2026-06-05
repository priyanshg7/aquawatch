import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AquaWatch | Smart Water Tank",
  description: "IoT based Smart Water Tank Monitoring and Control System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
