"use client"
import { Geist, Geist_Mono } from "next/font/google";
import { Roboto_Slab } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${robotoSlab.variable} antialiased`}
      >
        <main>
          {children}
        </main>
        <Toaster richColors />
      </body>
    </html>
  );
}
