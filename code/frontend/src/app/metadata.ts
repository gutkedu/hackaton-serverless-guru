import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TypeRacer - Real-time Typing Game",
  description: "A real-time typing race game where you can compete with friends",
  icons: {
    icon: "/favicon.ico",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
}; 