import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppBar } from "@/components/WhatsAppBar";
import { WishlistProvider } from "@/components/WishlistProvider";
import { Countdown } from "@/components/Countdown";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — Wear Something Okuhle`,
    template: `%s — ${site.name}`,
  },
  description: site.heroSub,
};

/** Applies the saved theme before first paint so there is no flash. */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('okuhle_theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Poppins:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <WishlistProvider>
          <Countdown />
          <Header />
          <main>{children}</main>
          <Footer />
          <WhatsAppBar />
        </WishlistProvider>
      </body>
    </html>
  );
}
