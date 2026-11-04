import "./globals.css";

export const metadata = {
  title: "Amoura",
  description: "Love, with intention.",
  applicationName: "Amoura",
  appleWebApp: { capable: true, title: "Amoura", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf3f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1b0d14" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
