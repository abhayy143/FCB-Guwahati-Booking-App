"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Calendar, MapPin, Clock, Ticket, ShieldAlert, ArrowLeft, 
  Printer, User, Phone, CheckCircle2, AlertCircle, XCircle 
} from "lucide-react";
import { fetchBookingById, fetchEventById, updateBookingCheckIn } from "@/lib/services";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/components/Toast";

const MOCK_EVENTS = {
  "mock-clasico": {
    id: "mock-clasico",
    title: "FC Barcelona vs Real Madrid - El Clásico Screening",
    type: "screening",
    date: "2026-10-24",
    time: "23:30",
    venue: "Underdog Sports Bar, Guwahati",
    price: 250,
    bannerImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
  },
  "mock-turf": {
    id: "mock-turf",
    title: "Weekly Turf Football - Culés Matchday",
    type: "turf",
    date: "2026-06-01",
    time: "19:00",
    venue: "Dribble Arena, Zoo Road, Guwahati",
    price: 150,
    bannerImage: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80"
  }
};

export default function TicketPassPage() {
  const { id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "admin@fcbguwahati.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCheckInToggle = async () => {
    if (!booking) return;
    setCheckInLoading(true);
    const newCheckedInState = !booking.checkedIn;
    try {
      await updateBookingCheckIn(booking.id, newCheckedInState);
      setBooking(prev => ({
        ...prev,
        checkedIn: newCheckedInState,
        checkedInAt: newCheckedInState ? new Date().toISOString() : null
      }));
      showToast(newCheckedInState ? "Pass successfully checked in!" : "Check-in reset successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update check-in status.", "error");
    } finally {
      setCheckInLoading(false);
    }
  };

  useEffect(() => {
    async function loadTicketData() {
      try {
        let bookingData = null;
        
        // Handle mock booking IDs
        if (id.startsWith("mock-")) {
          const isClasico = id.includes("clasico");
          bookingData = {
            id,
            eventId: isClasico ? "mock-clasico" : "mock-turf",
            eventTitle: isClasico ? "FC Barcelona vs Real Madrid - El Clásico Screening" : "Weekly Turf Football - Culés Matchday",
            userName: "Abhay Sharma (Mock)",
            phoneNumber: "9876543210",
            numberOfTickets: 2,
            totalAmount: isClasico ? 500 : 300,
            utrNumber: "312345678901",
            bookingStatus: id.endsWith("-pending") ? "pending" : id.endsWith("-rejected") ? "rejected" : "confirmed",
            createdAt: new Date().toISOString()
          };
        } else {
          bookingData = await fetchBookingById(id);
        }

        if (!bookingData) {
          setError("Ticket pass could not be resolved.");
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        // Fetch corresponding event details
        let eventData = null;
        if (bookingData.eventId.startsWith("mock-")) {
          eventData = MOCK_EVENTS[bookingData.eventId];
        } else {
          eventData = await fetchEventById(bookingData.eventId);
        }

        setEvent(eventData);
      } catch (err) {
        console.error(err);
        setError("Error loading ticket records.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadTicketData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner message="Validating entry permit..." fullPage />;

  if (error || !booking) {
    return (
      <div className="w-full bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-white/5">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black text-white">Pass Invalid</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{error || "No active ticket matches this reference code."}</p>
          <button
            onClick={() => router.push("/events")}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10"
          >
            Back to Calendars
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = booking.bookingStatus === "confirmed";
  const isRejected = booking.bookingStatus === "rejected";
  const isPending = booking.bookingStatus === "pending";

  const passUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0d1e3d&data=${encodeURIComponent(booking.id)}`;

  return (
    <div className="w-full bg-slate-950 min-h-screen pb-20 print:bg-white print:pb-0 print:text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 print:pt-0">
        
        {/* Navigation / Actions Row */}
        <div className="flex justify-between items-center print:hidden">
          <Link
            href="/my-bookings"
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Bookings</span>
          </Link>
          
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-900/80 text-xs font-bold rounded-xl border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass / Save PDF</span>
          </button>
        </div>

        {/* PREMIUM DIGITAL TICKET MOCKUP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative max-w-3xl mx-auto w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row bg-slate-900/80 backdrop-blur-md print:border-slate-300 print:shadow-none print:bg-white"
        >
          {/* Ticket Color Bar */}
          <div className="absolute top-0 left-0 w-full h-2.5 bg-blaugrana-gradient" />

          {/* Left / Main Section (Match Details) */}
          <div className="flex-1 p-8 sm:p-10 space-y-8 flex flex-col justify-between">
            {/* Event Branding header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="px-2.5 py-1 bg-blaugrana-gradient border border-gold/30 rounded-lg">
                  <span className="text-gold font-black text-xs tracking-tighter">FCB</span>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">FCB Guwahati Pass</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                event?.type === "screening" ? "border-blue-500/20 bg-blue-500/10 text-blue-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              }`}>
                {event?.type || "Matchday"}
              </span>
            </div>

            {/* Event Title */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight print:text-black">
                {booking.eventTitle}
              </h2>
              {event && (
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 print:text-slate-700">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span>{event.time} IST Kickoff</span>
                  </div>
                </div>
              )}
            </div>

            {/* Venue & Location details */}
            <div className="flex items-start space-x-3 text-xs bg-slate-950/40 p-4 rounded-2xl border border-white/5 print:border-slate-200 print:bg-slate-50">
              <MapPin className="w-4.5 h-4.5 text-gold flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-white font-extrabold block print:text-black">
                  {event?.venue || "Official Venue"}
                </span>
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider block">
                  Guwahati Fan base
                </span>
              </div>
            </div>

            {/* Member profile details */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 text-xs print:border-slate-200">
              <div>
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px] block">Attendee</span>
                <span className="text-white font-black text-sm flex items-center space-x-1 mt-1 print:text-black">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>{booking.userName}</span>
                </span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px] block">WhatsApp Contact</span>
                <span className="text-slate-300 font-bold flex items-center space-x-1 mt-1 print:text-black">
                  <Phone className="w-3.5 h-3.5 text-gold" />
                  <span>{booking.phoneNumber}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Dotted Tear-Off Card Divider */}
          <div className="relative flex md:flex-col items-center justify-between py-4 md:py-0 md:px-2 select-none">
            {/* Top punch hole */}
            <div className="absolute top-0 left-1/2 md:left-auto md:right-0 md:top-0 -translate-x-1/2 md:translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-b border-white/10 md:border-b-0 md:border-l md:border-white/10 z-10 print:bg-white print:border-slate-300" />
            
            {/* Dotted Line */}
            <div className="w-full md:w-0 h-0 md:h-full border-t-2 md:border-l-2 border-dashed border-white/10 md:mx-auto print:border-slate-300" />
            
            {/* Bottom punch hole */}
            <div className="absolute bottom-0 left-1/2 md:left-auto md:right-0 md:bottom-0 -translate-x-1/2 md:translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-t border-white/10 md:border-t-0 md:border-l md:border-white/10 z-10 print:bg-white print:border-slate-300" />
          </div>

          {/* Right / Tear-Off Stub (QR Gate Check) */}
          <div className="w-full md:w-[260px] p-8 sm:p-10 flex flex-col items-center justify-between bg-slate-900/60 print:bg-white print:w-full print:pt-6">
            
            {/* Status indicator */}
            <div className="text-center space-y-1.5 w-full flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Entry Status</span>
              <div className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${
                booking.checkedIn
                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400 animate-pulse"
                  : isConfirmed 
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : isRejected
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
              }`}>
                {booking.checkedIn ? <CheckCircle2 className="w-3.5 h-3.5" /> : isConfirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : isRejected ? <XCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{booking.checkedIn ? "Checked In" : booking.bookingStatus}</span>
              </div>
            </div>

            {/* Live Entry QR Code */}
            {booking.checkedIn ? (
              <div className="my-8 text-center p-4 border border-dashed border-yellow-500/20 rounded-2xl bg-yellow-500/5 max-w-[180px]">
                <CheckCircle2 className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-bounce" />
                <h4 className="text-yellow-400 font-bold text-xs uppercase tracking-wider">Scanned & Valid</h4>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                  Checked in at {new Date(booking.checkedInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            ) : isConfirmed || isPending ? (
              <div className="my-6 text-center space-y-2 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-4 border-slate-950 shadow-inner flex items-center justify-center">
                  <Image
                    src={passUrl}
                    alt="Booking Pass QR Code"
                    width={130}
                    height={130}
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <span className="text-[9px] text-muted-foreground font-mono tracking-widest block select-all">
                  REF: #{booking.id.substring(0, 10).toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="my-8 text-center p-4 border border-dashed border-rose-500/20 rounded-2xl bg-rose-500/5 max-w-[180px]">
                <XCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <h4 className="text-rose-400 font-bold text-xs">Pass Voided</h4>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">This transaction request was rejected by admin checks.</p>
              </div>
            )}

            {/* Stub Ticket quantities */}
            <div className="border-t border-white/5 pt-4 w-full text-center print:border-slate-200">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Pass Volume</span>
              <span className="text-white font-black text-lg flex items-center justify-center space-x-1.5 mt-0.5 print:text-black">
                <Ticket className="w-4 h-4 text-gold" />
                <span>{booking.numberOfTickets} Passes</span>
              </span>
            </div>

          </div>

        </motion.div>

        {/* Admin Gate Verification Panel */}
        {isAdmin && (
          <div className="max-w-3xl mx-auto p-6 bg-slate-900 border border-gold/30 rounded-3xl space-y-4 print:hidden shadow-lg shadow-gold/5 animate-pulse-once">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Gate Admin Control</h4>
              </div>
              <span className="text-[10px] text-gold font-bold uppercase tracking-widest">FCB Guwahati staff</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Attendee Status</span>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {booking.userName} • {booking.numberOfTickets} Passes
                </p>
                <p className="text-xs text-slate-400">
                  UTR: {booking.utrNumber} | Status: <span className="text-gold font-bold">{booking.bookingStatus}</span>
                </p>
              </div>

              {!isConfirmed ? (
                <div className="text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">
                  ⚠️ Cannot check in: Booking must be Approved first.
                </div>
              ) : booking.checkedIn ? (
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-xl">
                    ✓ Already Checked In
                  </span>
                  <button
                    onClick={handleCheckInToggle}
                    disabled={checkInLoading}
                    className="px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCheckInToggle}
                  disabled={checkInLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-gold hover:bg-gold/90 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-300 hover:scale-102 border-glow-gold"
                >
                  {checkInLoading ? "Verifying..." : "Confirm & Check In"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Gate Check-in Instructions */}
        <div className="max-w-3xl mx-auto p-5 sm:p-6 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2.5 print:hidden">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gate Access Instructions</h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
            <li>Open this page on your mobile phone when arriving at the venue.</li>
            <li>Admins will scan the QR code to verify your transaction UTR reference.</li>
            <li>Do not share this link or screenshot with others. It can only be validated once.</li>
            <li>For support, contact the FCB Guwahati core team directly.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
