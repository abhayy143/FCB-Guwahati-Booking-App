"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Ticket, Info, ShieldAlert, ArrowLeft, 
  MapPin, Clock, User, Phone, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fetchUserBookings } from "@/lib/services";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

export default function MyBookingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // Authenticate user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Not logged in, redirect to login
        router.push("/login?redirect=/my-bookings");
      } else {
        setUser(currentUser);
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load user bookings
  useEffect(() => {
    if (!user) return;
    
    async function loadBookings() {
      try {
        const userBookings = await fetchUserBookings(user.uid);
        setBookings(userBookings);
      } catch (err) {
        console.error("Failed to load user bookings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [user]);

  if (authChecking || loading) {
    return <LoadingSpinner message="Consulting match ticket logs..." fullPage />;
  }

  return (
    <div className="w-full bg-slate-950 min-h-screen text-slate-100 pb-20">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/60 p-6 rounded-3xl border border-white/5 gap-4 backdrop-blur-md">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blaugrana-gradient border border-gold/30 rounded-2xl shadow-lg">
              <Ticket className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">My Bookings</h1>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Your Matchday Registrations</p>
            </div>
          </div>
          <Link
            href="/events"
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Book Another Event</span>
          </Link>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-16 text-center border border-white/5"
          >
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No Tickets Booked Yet</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              You haven&apos;t registered for any screenings or turf sessions yet. Head over to our events calendar to secure your pass!
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center px-6 py-3 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl text-sm transition-all duration-300 border-glow-gold hover:scale-105"
            >
              Browse Live Events
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {bookings.map((booking, idx) => {
                const isConfirmed = booking.bookingStatus === "confirmed";
                const isRejected = booking.bookingStatus === "rejected";
                const isPending = booking.bookingStatus === "pending";

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card p-6 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    {/* Event & Pass Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                          isConfirmed 
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : isRejected
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                            : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isRejected && <XCircle className="w-3.5 h-3.5" />}
                          {isPending && <AlertCircle className="w-3.5 h-3.5" />}
                          <span>{booking.bookingStatus}</span>
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2">
                        {booking.eventTitle}
                      </h3>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 max-w-sm pt-2 text-xs text-slate-300 font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <Ticket className="w-4 h-4 text-gold flex-shrink-0" />
                          <span>{booking.numberOfTickets} Passes</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-gold">₹{booking.totalAmount}</span>
                          <span className="text-muted-foreground font-medium">Total Paid</span>
                        </div>
                        <div className="col-span-2 flex items-center space-x-1.5 pt-1 text-[11px] text-muted-foreground font-mono">
                          <span>UTR: {booking.utrNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Ticket Pass Link */}
                    <div className="w-full md:w-auto flex justify-end flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                      <Link
                        href={`/tickets/${booking.id}`}
                        className="w-full sm:w-auto px-6 py-3 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider text-center transition-all duration-300 hover:scale-102 border-glow-gold"
                      >
                        View digital ticket pass
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
