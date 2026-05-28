import Link from "next/link";
import { Shield, Mail, Phone, MapPin, Globe, Tv, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-white/5 py-12 px-6 sm:px-12 print:hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Info Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blaugrana-gradient border border-gold/30">
              <span className="text-gold font-black tracking-tighter text-md">FCB</span>
            </div>
            <span className="font-extrabold text-white text-lg tracking-wide">
              FCB GUWAHATI
            </span>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">
            Guwahati&apos;s official FC Barcelona fan community. Bringing culés together for epic screenings, competitive turf battles, and football talk.
          </p>
          <div className="flex space-x-3 pt-2">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-gold hover:bg-white/10 transition-colors" title="Instagram">
              <Globe className="w-5 h-5" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-gold hover:bg-white/10 transition-colors" title="YouTube">
              <Tv className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Quick Links</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-gold transition-colors">All Events</Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-gold transition-colors">Admin Area</Link>
            </li>
            <li>
              <a href="https://chat.whatsapp.com/JDFcSdTcCKzLfQEgA5mdVd" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-gold transition-colors">
                <span>WhatsApp Group</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Contact & Support</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Guwahati, Assam, India</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gold flex-shrink-0" />
              <a href="mailto:contact@fcbguwahati.com" className="hover:text-white transition-colors">info@fcbguwahati.com</a>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gold flex-shrink-0" />
              <span>+91 98765 43210</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
        <div>
          &copy; {new Date().getFullYear()} FCB Guwahati. All rights reserved.
        </div>
        <div className="flex space-x-2">
          <span>Made for the Culés of Guwahati.</span>
          <span className="text-red-500">♥</span>
          <span className="text-gold font-bold">Més que un club</span>
        </div>
      </div>
    </footer>
  );
}
