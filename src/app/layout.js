import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { Analytics } from '@vercel/analytics/next';

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "FCB Guwahati | Official Barcelona Fan Community Platform",
  description: "Join FCB Guwahati. Book live match screenings, register for competitive turf sessions, pay directly via UPI, and connect with fellow Barça fans in Guwahati.",
  keywords: ["FCB Guwahati", "Guwahati Football", "Barcelona Fan Club Assam", "Turf bookings Guwahati", "Live match screening Guwahati"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${outfit.variable} font-sans bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased`}>
        <ToastProvider>
          <Navbar />
          <main className="flex-grow w-full flex flex-col">
            {children}
          </main>
          <Footer />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
