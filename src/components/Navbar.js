"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Shield, Calendar, Home, LogOut, LogIn, User, Ticket } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useToast } from "@/components/Toast";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Signed out successfully", "info");
      router.push("/");
    } catch (err) {
      console.error(err);
      showToast("Sign out failed", "error");
    }
  };

  const isActive = (path) => pathname === path;

  // Determine dynamic links based on user status
  const isAdmin = user && user.email === "admin@fcbguwahati.com";

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Events", href: "/events", icon: Calendar },
  ];

  if (user) {
    if (isAdmin) {
      navLinks.push({ name: "Admin Dashboard", href: "/admin", icon: Shield });
    } else {
      navLinks.push({ name: "My Bookings", href: "/my-bookings", icon: Ticket });
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel backdrop-blur-md border-b border-white/10 transition-all duration-300 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative p-2 rounded-xl bg-blaugrana-gradient border border-gold/30 group-hover:border-gold/60 transition-all duration-300">
                <span className="text-gold font-black tracking-tighter text-lg">FCB</span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-white text-md sm:text-lg tracking-wide leading-none group-hover:text-gold transition-colors duration-300">
                  FCB GUWAHATI
                </span>
                <span className="text-[10px] text-muted-foreground tracking-widest font-semibold uppercase leading-none mt-1">
                  OFFICIAL FAN CLUB
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 ${
                    active
                      ? "bg-white/10 text-gold border border-gold/20 shadow-sm"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-gold" : "text-muted-foreground"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Auth Buttons */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-3 pl-4 border-l border-white/10 ml-3">
                    <span className="text-xs text-slate-300 font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-gold" />
                      <span className="max-w-[100px] truncate">{user.displayName || user.email.split("@")[0]}</span>
                    </span>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all duration-300"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="ml-4 px-5 py-2.5 bg-gold text-black hover:bg-gold/90 font-bold rounded-xl text-sm transition-all duration-300 hover:scale-105 border-glow-gold flex items-center space-x-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 focus:outline-none transition-all duration-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-lg transition-all duration-300 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="px-2 pt-3 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                    active
                      ? "bg-white/10 text-gold border border-gold/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Mobile Auth Button */}
            {!loading && (
              <div className="pt-4 px-4 border-t border-white/5 mt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-slate-300 font-bold bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                      <User className="w-4.5 h-4.5 text-gold" />
                      <span>{user.displayName || user.email}</span>
                    </div>
                    <button
                      onClick={() => { setIsOpen(false); handleLogout(); }}
                      className="w-full py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl text-base transition-all duration-300 flex items-center justify-center space-x-1.5"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center py-3 bg-gold text-black hover:bg-gold/95 font-bold rounded-xl text-base transition-all duration-300 space-x-1.5"
                  >
                    <LogIn className="w-4.5 h-4.5" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
