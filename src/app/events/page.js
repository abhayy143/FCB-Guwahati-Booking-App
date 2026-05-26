"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Calendar, MapPin, Ticket, AlertCircle } from "lucide-react";
import Image from "next/image";
import { fetchEvents } from "@/lib/services";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  },
  {
    id: "mock-derbi",
    title: "FC Barcelona vs Espanyol - Barcelona Derbi Screening",
    type: "screening",
    date: "2026-11-08",
    time: "21:00",
    venue: "Underdog Sports Bar, Guwahati",
    price: 200,
    maxSeats: 100,
    remainingSeats: 0,
    description: "Catch the fierce local derby live on the giant screens. Entry passes include a complimentary soft drink.",
    bannerImage: "https://images.unsplash.com/photo-1579952360673-2d029900798e?w=800&auto=format&fit=crop&q=80"
  }
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'screening' | 'turf'

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

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || event.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full bg-dark-gradient min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center md:text-left space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            COMMUNITY <span className="bg-gradient-to-r from-blue-500 via-yellow-500 to-red-600 bg-clip-text text-transparent">EVENTS</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg">
            Register for weekly turf football sessions or book entry passes for high-energy match screenings.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by match title, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input font-medium"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex w-full md:w-auto items-center p-1 rounded-xl bg-slate-950 border border-white/5 space-x-1">
            {[
              { id: "all", label: "All Events" },
              { id: "screening", label: "Screenings" },
              { id: "turf", label: "Turf Sessions" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${
                  filterType === tab.id
                    ? "bg-blaugrana-gradient text-white shadow-lg border border-gold/25"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <LoadingSpinner message="Searching events calendar..." />
        ) : filteredEvents.length === 0 ? (
          <div className="glass-card p-16 text-center rounded-2xl space-y-4 max-w-md mx-auto border border-white/5">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Events Found</h3>
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t find any matches matching your filters. Try checking spelling or change filters.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setFilterType("all"); }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const isSoldOut = event.remainingSeats <= 0;
              return (
                <div 
                  key={event.id}
                  className="glass-card flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 group h-full"
                >
                  {/* Banner Image */}
                  <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                    <Image
                      src={event.bannerImage}
                      alt={event.title}
                      width={400}
                      height={250}
                      priority={false}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-sm border border-white/10 text-xs font-black uppercase tracking-wider">
                      <span className={event.type === "screening" ? "text-blue-400" : "text-emerald-400"}>
                        {event.type}
                      </span>
                    </div>
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                        <span className="px-5 py-2 bg-rose-600/90 text-white font-black text-sm uppercase tracking-wider rounded-lg border-glow border border-rose-500/30">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-xl font-extrabold text-white group-hover:text-gold transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm text-slate-300 font-medium pt-4 border-t border-white/5">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                        <span>{event.date} • {event.time} IST</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4 text-gold flex-shrink-0" />
                        <span>
                          {isSoldOut 
                            ? "No Slots Remaining" 
                            : `${event.remainingSeats} of ${event.maxSeats} slots left`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Pass Price</span>
                        <span className="text-xl font-black text-white">₹{event.price}</span>
                      </div>
                      
                      <Link
                        href={`/events/${event.id}`}
                        className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${
                          isSoldOut 
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                            : "bg-gold text-black hover:bg-gold/90 hover:scale-105 border-glow-gold"
                        }`}
                      >
                        {isSoldOut ? "Details Only" : "Book Pass"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
