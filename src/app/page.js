"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, MapPin, Users, Trophy, ChevronRight, Activity, ArrowRight } from "lucide-react";
import { fetchEvents } from "@/lib/services";
import LoadingSpinner from "@/components/LoadingSpinner";

// Mock events for initial presentation if database is empty
const MOCK_EVENTS = [
  {
    id: "mock-clasico",
    title: "FC Barcelona vs Real Madrid - El Clásico Screening",
    type: "screening",
    date: "2026-10-24",
    time: "23:30",
    venue: "Underdog Sports Bar, Guwahati",
    price: 250,
    maxSeats: 150,
    remainingSeats: 120,
    description: "Join Guwahati's biggest El Clásico screening! Commentary, banners, foods/drinks, and 150+ Culés chanting together.",
    bannerImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "mock-turf",
    title: "Weekly Turf Football - Culés Matchday",
    type: "turf",
    date: "2026-06-01",
    time: "19:00",
    venue: "Dribble Arena, Zoo Road, Guwahati",
    price: 150,
    maxSeats: 18,
    remainingSeats: 8,
    description: "Our weekly 9v9 friendly match. Grab your slots, wear your Barca jersey, and let's play some beautiful tiki-taka!",
    bannerImage: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80"
  }
];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchEvents();
        if (data && data.length > 0) {
          setEvents(data);
        } else {
          setEvents(MOCK_EVENTS);
        }
      } catch (error) {
        console.error("Failed to load events, using mock fallbacks:", error);
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    { label: "Active Members", value: "500+", icon: Users },
    { label: "Screenings Hosted", value: "45+", icon: Trophy },
    { label: "Turf Matches", value: "100+", icon: Activity },
  ];

  // Separate screening and turf events
  const screeningEvents = events.filter(e => e.type === "screening").slice(0, 2);
  const turfEvents = events.filter(e => e.type === "turf").slice(0, 2);

  return (
    <div className="w-full bg-dark-gradient min-h-screen pb-16">

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 flex items-center justify-center border-b border-white/5">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(0,102,178,0.15),transparent_50%)] animate-pulse-slow" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Guwahati&apos;s Fan Club</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white"
          >
            Official <span className="bg-gradient-to-r from-blue-500 via-yellow-500 to-red-600 bg-clip-text text-transparent">FCB Guwahati</span> <br />
            Community Platform
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium"
          >
            Book screenings, join turf sessions, and experience football together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-4 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl shadow-lg border-glow-gold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 text-md"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://chat.whatsapp.com/JDFcSdTcCKzLfQEgA5mdVd"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all duration-300 flex items-center justify-center space-x-2 text-md"
            >
              Join Community
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card p-6 flex items-center space-x-5"
              >
                <div className="p-4 rounded-xl bg-blaugrana-gradient border border-gold/20 flex-shrink-0">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {loading ? (
        <LoadingSpinner message="Fetching local events..." />
      ) : (
        <>
          {/* 3. UPCOMING SCREENINGS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Match Screenings
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">
                  Catch the Barça matches live on big screens with fellow fans.
                </p>
              </div>
              <Link href="/events" className="hidden sm:flex items-center text-sm font-bold text-gold hover:underline">
                View All Screenings <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {screeningEvents.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl">
                <p className="text-muted-foreground">No upcoming match screenings scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {screeningEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>

          {/* 4. TURF SESSIONS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Turf Football Matches
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">
                  Lace up and join local community turf matches. Weekly slots open.
                </p>
              </div>
              <Link href="/events" className="hidden sm:flex items-center text-sm font-bold text-gold hover:underline">
                View All Turf Matches <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {turfEvents.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl">
                <p className="text-muted-foreground">No turf matches planned for this week.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {turfEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* 5. CTA COMMUNITY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="relative rounded-3xl overflow-hidden bg-blaugrana-gradient border border-gold/10 p-8 sm:p-12 md:p-16 text-center space-y-6">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] z-0" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Més Que Un Club
            </h2>
            <p className="text-slate-200 text-base sm:text-lg font-medium">
              We are more than just a fan group—we are a family. Join our WhatsApp group to participate in discussions, transfer rumors chat, fantasy leagues, and weekly kickabouts.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://chat.whatsapp.com/JDFcSdTcCKzLfQEgA5mdVd"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl transition-all duration-300 shadow-lg border-glow-gold hover:scale-105"
              >
                Join WhatsApp Group
              </a>
              <Link
                href="/events"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-white/10 transition-all duration-300"
              >
                View Event Calendars
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EventCard({ event }) {
  const isSoldOut = event.remainingSeats <= 0;

  return (
    <div className="glass-card overflow-hidden rounded-2xl flex flex-col md:flex-row group border border-white/5">
      {/* Banner */}
      <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-slate-900 overflow-hidden">
        <Image
          src={event.bannerImage}
          alt={event.title}
          width={400}
          height={300}
          priority={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md bg-slate-950/80 border border-white/10">
          <span className={event.type === "screening" ? "text-blue-400" : "text-emerald-400"}>
            {event.type}
          </span>
        </div>
      </div>

      {/* Detail */}
      <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-white group-hover:text-gold transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {event.description}
          </p>
        </div>

        <div className="space-y-1.5 text-sm text-slate-300 font-medium">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
            <span>{event.date} • {event.time} IST</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pass Ticket</div>
            <div className="text-lg font-black text-white">₹{event.price}</div>
          </div>

          <Link
            href={`/events/${event.id}`}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${isSoldOut
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-gold text-black hover:bg-gold/90 hover:scale-105 border-glow-gold"
              }`}
          >
            {isSoldOut ? "Sold Out" : "Book Pass"}
          </Link>
        </div>
      </div>
    </div>
  );
}
