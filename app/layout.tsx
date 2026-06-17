import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/constants/site";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import EnquiryModal from "@/components/EnquiryModel";

export const metadata: Metadata = {
  title: siteConfig.title,
  description:siteConfig.description
    ,
  keywords: siteConfig.keywords,
  icons: {
  icon: "/favicon.svg",
  shortcut: "/favicon-32x32.png",
  apple: "/apple-touch-icon.png",
},
  openGraph: {
    title: "Educational Industry Visits UAE | HeecoWorld",
    description:
      "Connecting education with real-world industry exposure.",
    url: "https://heecoworld.com",
    siteName: "HeecoWorld",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
         <Navbar />
        {children}
         <Footer />
          <EnquiryModal />
        </body>
    </html>
  );
}