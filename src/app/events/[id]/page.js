"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Calendar, MapPin, Ticket, ShieldAlert, ArrowLeft, Users, CircleDollarSign, BadgeAlert } from "lucide-react";
import { fetchEventById } from "@/lib/services";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

const MOCK_EVENTS = {
  "mock-clasico": {
    id: "mock-clasico",
    title: "FC Barcelona vs Real Madrid - El Clásico Screening",
    type: "screening",
    date: "2026-10-24",
    time: "23:30",
    venue: "Underdog Sports Bar, Guwahati",
    price: 250,
    maxSeats: 150,
    remainingSeats: 120,
    description: "Join Guwahati's biggest El Clásico screening! Match will be broadcasted on a giant projector screen with professional commentary. Food and beverage deals are available at the counter. Wear your blaugrana colors, bring your flags, and let's turn the venue into a mini Camp Nou! Entry passes are compulsory for entry.",
    bannerImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80"
  },
  "mock-turf": {
    id: "mock-turf",
    title: "Weekly Turf Football - Culés Matchday",
    type: "turf",
    date: "2026-06-01",
    time: "19:00",
    venue: "Dribble Arena, Zoo Road, Guwahati",
    price: 150,
    maxSeats: 18,
    remainingSeats: 8,
    description: "Calling all local Culés! This is our weekly friendly matchday. We book a premium 9v9 turf and play for 2 hours. It's a casual, competitive kickoff designed to keep us fit and connect with community members. Bibs will be provided. Please make sure to carry turf shoes and a water bottle.",
    bannerImage: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop&q=80"
  },
  "mock-derbi": {
    id: "mock-derbi",
    title: "FC Barcelona vs Espanyol - Derbi Screening",
    type: "screening",
    date: "2026-11-08",
    time: "21:00",
    venue: "Underdog Sports Bar, Guwahati",
    price: 200,
    maxSeats: 100,
    remainingSeats: 0,
    description: "Watch the Barcelona local derby live. Let's support the team as they face local rivals. Booking covers general admission and one complimentary beverage. Doors open 30 minutes prior to kickoff.",
    bannerImage: "https://images.unsplash.com/photo-1579952360673-2d029900798e?w=1200&auto=format&fit=crop&q=80"
  }
};

export default function SingleEventPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        if (id.startsWith("mock-")) {
          const mockData = MOCK_EVENTS[id];
          if (mockData) {
            setEvent(mockData);
          } else {
            setError("Event not found");
          }
        } else {
          const data = await fetchEventById(id);
          if (data) {
            setEvent(data);
          } else {
            setError("Event not found");
          }
        }
      } catch (err) {
        console.error("Failed to load event:", err);
        setError("Error loading event. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadEvent();
  }, [id]);

  if (loading) return <LoadingSpinner message="Opening event coordinates..." fullPage />;
  
  if (error || !event) {
    return (
      <div className="w-full bg-dark-gradient min-h-screen flex flex-col items-center justify-center py-20 px-6">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-white/5">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-white">Event Unavailable</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The event link you clicked might be outdated or removed by the admin.
          </p>
          <button
            onClick={() => router.push("/events")}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all duration-300"
          >
            Return to Calendars
          </button>
        </div>
      </div>
    );
  }

  const isSoldOut = event.remainingSeats <= 0;

  return (
    <div className="w-full bg-dark-gradient min-h-screen pb-20">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative w-full h-[300px] sm:h-[450px] bg-slate-900 overflow-hidden border-b border-white/5">
        <Image
          src={event.bannerImage}
          alt={event.title}
          fill
          priority={true}
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/events"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-sm text-sm font-bold text-white hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </Link>
        </div>

        {/* Banner Title Card */}
        <div className="absolute bottom-6 sm:bottom-10 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <span className={`inline-block px-3.5 py-1 text-xs font-black uppercase tracking-widest rounded-lg bg-slate-950/90 border border-white/10 ${
              event.type === "screening" ? "text-blue-400" : "text-emerald-400"
            }`}>
              {event.type}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. PAGE CONTENT DETAILS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Description & Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <h2 className="text-2xl font-black text-white tracking-tight border-b border-white/5 pb-4">
              About the Event
            </h2>
            <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
          
          {/* Venue and Map info */}
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <h2 className="text-2xl font-black text-white tracking-tight border-b border-white/5 pb-4">
              Location & Details
            </h2>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 mt-1">
                <MapPin className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">{event.venue}</h4>
                <p className="text-muted-foreground text-sm mt-1">
                  Guwahati, Assam. Make sure to arrive 15 minutes before the start time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Pricing / Booking Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 border border-white/5 space-y-6 sticky top-24">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pass Entry Price</span>
                <div className="text-3xl font-black text-white">₹{event.price}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">Remaining Slots</span>
                <span className={`text-lg font-black ${isSoldOut ? "text-rose-500 animate-pulse" : "text-emerald-400"}`}>
                  {isSoldOut ? "SOLD OUT" : `${event.remainingSeats} Seats`}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-4 text-sm text-slate-300 font-medium">
              <div className="flex items-center space-x-3 py-1">
                <Calendar className="w-5 h-5 text-gold flex-shrink-0" />
                <span>{event.date} at {event.time} IST</span>
              </div>
              <div className="flex items-center space-x-3 py-1">
                <CircleDollarSign className="w-5 h-5 text-gold flex-shrink-0" />
                <span>Direct UPI Payment accepted</span>
              </div>
              <div className="flex items-center space-x-3 py-1">
                <Users className="w-5 h-5 text-gold flex-shrink-0" />
                <span>Max Capacity: {event.maxSeats} Fans</span>
              </div>
            </div>

            {/* Booking Action Button */}
            {isSoldOut ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-4 bg-slate-800 text-slate-500 font-black rounded-2xl cursor-not-allowed border border-white/5 flex items-center justify-center space-x-2 text-md"
                >
                  <BadgeAlert className="w-5 h-5 text-rose-500/50" />
                  <span>Passes Sold Out</span>
                </button>
                <p className="text-center text-xs text-rose-400/80 font-semibold uppercase tracking-wider">
                  Contact admin for emergency spots.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href={`/events/${event.id}/book`}
                  className="w-full py-4 bg-gold hover:bg-gold/90 text-black font-black rounded-2xl shadow-lg border-glow-gold transition-all duration-300 hover:scale-102 flex items-center justify-center space-x-2 text-md"
                >
                  <Ticket className="w-5 h-5 text-black" />
                  <span>Book Entry Pass</span>
                </Link>
                <p className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Safe & Secure Direct UPI Verification
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
