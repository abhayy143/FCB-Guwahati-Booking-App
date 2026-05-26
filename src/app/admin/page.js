"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Check, X, Eye, Plus, Calendar, DollarSign, 
  Ticket, FileText, Phone, User, LogOut, Image as ImageIcon, 
  ShieldAlert, RefreshCw, BarChart2, Filter, Info, Mail, MessageSquare,
  Edit2, Trash2
} from "lucide-react";
import { 
  fetchAllBookings, 
  updateBookingStatus, 
  createEvent, 
  uploadFile, 
  fetchEvents,
  updateEvent,
  deleteEvent,
  updateBookingCheckIn,
  fetchBookingById
} from "@/lib/services";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

export default function AdminPage() {
  const { showToast } = useToast();

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores bookingId being processed

  // Navigation tab: 'bookings' | 'create-event'
  const [activeTab, setActiveTab] = useState("bookings");
  
  // Bookings filter: 'all' | 'pending' | 'confirmed' | 'rejected'
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(10);

  // Screenshot Lightbox modal
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  // New Event Form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("screening"); // 'screening' | 'turf'
  const [eventDescription, setEventDescription] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventMaxSeats, setEventMaxSeats] = useState("");
  const [eventBannerFile, setEventBannerFile] = useState(null);
  const [eventBannerPreview, setEventBannerPreview] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Editing Event states
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("screening");
  const [editDescription, setEditDescription] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMaxSeats, setEditMaxSeats] = useState("");
  const [editBannerFile, setEditBannerFile] = useState(null);
  const [editBannerPreview, setEditBannerPreview] = useState(null);
  const [updatingEvent, setUpdatingEvent] = useState(false);

  // Scanner states
  const [scanIdInput, setScanIdInput] = useState("");
  const [scannedBooking, setScannedBooking] = useState(null);
  const [checkInActionLoading, setCheckInActionLoading] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsData, eventsData] = await Promise.all([
        fetchAllBookings(),
        fetchEvents()
      ]);
      setBookings(bookingsData);
      setEvents(eventsData);
    } catch (err) {
      console.error("Error loading admin data:", err);
      showToast("Failed to load dashboard records", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Listen to Auth State changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "admin@fcbguwahati.com") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch bookings and events if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboardData();
  }, [isAuthenticated, loadDashboardData]);

  // Reset pagination limit on filter or search query changes
  useEffect(() => {
    setVisibleLimit(10);
  }, [bookingFilter, searchQuery]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Access Granted. Welcome back admin!", "success");
    } catch (err) {
      console.error("Auth login failed:", err);
      let msg = "Invalid email or password.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Invalid admin credentials.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many login attempts. Try again later.";
      }
      setAuthError(msg);
      showToast(msg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully", "info");
    } catch (err) {
      console.error(err);
      showToast("Logout failed", "error");
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      showToast(`Booking status marked as ${status}!`, "success");
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === bookingId ? { ...b, bookingStatus: status } : b)
      );
      
      // Refresh event lists too to reflect any returned seats on rejection
      const eventsData = await fetchEvents();
      setEvents(eventsData);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to update booking status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEventBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventBannerFile) {
      showToast("Please upload an event banner image", "error");
      return;
    }

    setCreatingEvent(true);
    try {
      // 1. Upload Event Banner
      const bannerUrl = await uploadFile(eventBannerFile, "banners");

      // 2. Publish event to Firestore
      await createEvent({
        title: eventTitle,
        type: eventType,
        description: eventDescription,
        venue: eventVenue,
        date: eventDate,
        time: eventTime,
        price: eventPrice,
        maxSeats: eventMaxSeats,
        bannerImage: bannerUrl
      });

      showToast("New event published successfully!", "success");
      
      // Reset Form states
      setEventTitle("");
      setEventDescription("");
      setEventVenue("");
      setEventDate("");
      setEventTime("");
      setEventPrice("");
      setEventMaxSeats("");
      setEventBannerFile(null);
      setEventBannerPreview(null);
      
      // Navigate to bookings list and reload data
      setActiveTab("bookings");
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast("Failed to create event", "error");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleStartEdit = (eventObj) => {
    setEditingEvent(eventObj);
    setEditTitle(eventObj.title);
    setEditType(eventObj.type || "screening");
    setEditDescription(eventObj.description || "");
    setEditVenue(eventObj.venue || "");
    setEditDate(eventObj.date || "");
    setEditTime(eventObj.time || "");
    setEditPrice(eventObj.price || "");
    setEditMaxSeats(eventObj.maxSeats || "");
    setEditBannerPreview(eventObj.bannerImage || null);
    setEditBannerFile(null);
  };

  const handleEditBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateEventSubmit = async (e) => {
    e.preventDefault();
    setUpdatingEvent(true);
    try {
      let bannerUrl = editingEvent.bannerImage;
      if (editBannerFile) {
        bannerUrl = await uploadFile(editBannerFile, "banners");
      }

      await updateEvent(editingEvent.id, {
        title: editTitle,
        type: editType,
        description: editDescription,
        venue: editVenue,
        date: editDate,
        time: editTime,
        price: Number(editPrice),
        maxSeats: Number(editMaxSeats),
        bannerImage: bannerUrl
      });

      showToast("Event updated successfully!", "success");
      setEditingEvent(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to update event", "error");
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleDeleteEventClick = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This cannot be undone.`)) {
      try {
        await deleteEvent(eventId);
        showToast("Event deleted successfully!", "success");
        loadDashboardData();
      } catch (err) {
        console.error(err);
        showToast("Failed to delete event", "error");
      }
    }
  };

  const handleScannerCheckInUpdate = async (bookingId, checkedInState) => {
    try {
      await updateBookingCheckIn(bookingId, checkedInState);
      showToast(checkedInState ? "Gate check-in registered!" : "Check-in reset!", "success");
      setScannedBooking(prev => prev && prev.id === bookingId ? { ...prev, checkedIn: checkedInState, checkedInAt: checkedInState ? new Date().toISOString() : null } : prev);
      
      // Update local bookings list too
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === bookingId ? { ...b, checkedIn: checkedInState, checkedInAt: checkedInState ? new Date().toISOString() : null } : b)
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to update check-in", "error");
    }
  };

  const handleManualScanSubmit = async () => {
    if (!scanIdInput.trim()) {
      showToast("Please enter a valid ticket reference ID", "error");
      return;
    }
    setLoading(true);
    try {
      const targetId = scanIdInput.trim().toLowerCase();
      let bookingData = null;
      if (targetId.startsWith("mock-")) {
        bookingData = {
          id: targetId,
          eventTitle: "El Clásico Screening",
          userName: "Abhay Sharma (Mock)",
          phoneNumber: "9876543210",
          numberOfTickets: 2,
          utrNumber: "312345678901",
          bookingStatus: "confirmed",
          checkedIn: false,
          createdAt: new Date().toISOString()
        };
      } else {
        bookingData = await fetchBookingById(targetId);
      }

      if (!bookingData) {
        showToast("Invalid ticket reference code", "error");
        setScannedBooking(null);
      } else {
        setScannedBooking(bookingData);
        showToast("Ticket verified!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Error retrieving ticket details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInStatusUpdate = async (bookingId, checkedInValue) => {
    setCheckInActionLoading(bookingId);
    try {
      await updateBookingCheckIn(bookingId, checkedInValue);
      showToast(checkedInValue ? "Attendee checked in successfully!" : "Check-in reset successfully!", "success");
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === bookingId ? { ...b, checkedIn: checkedInValue, checkedInAt: checkedInValue ? new Date().toISOString() : null } : b)
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to update check-in status", "error");
    } finally {
      setCheckInActionLoading(null);
    }
  };

  // Helper calculations for metrics dashboard
  const confirmedBookings = bookings.filter(b => b.bookingStatus === "confirmed");
  const pendingBookings = bookings.filter(b => b.bookingStatus === "pending");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + Number(b.numberOfTickets), 0);

  const handleSendWhatsApp = (booking) => {
    const baseUrl = window.location.origin;
    const message = `Hi ${booking.userName},\n\nYour booking request for the event:\n🔥 *${booking.eventTitle}*\nhas been *CONFIRMED* by the FCB Guwahati Admin! 🎉\n\n🎟️ Passes: ${booking.numberOfTickets}\n💰 Paid: ₹${booking.totalAmount}\n🎫 Booking ID: ${booking.id.toUpperCase()}\n\nPlease view and show your Digital Ticket Pass at the venue entrance:\n🔗 ${baseUrl}/tickets/${booking.id}\n\nVisca el Barça! 🔴🔵\nFCB Guwahati Fan Club`;
    const encodedMessage = encodeURIComponent(message);
    let phone = booking.phoneNumber.replace(/\D/g, "");
    if (phone.length === 10) {
      phone = `91${phone}`;
    }
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === "all" || b.bookingStatus === bookingFilter;
    const matchesSearch = 
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phoneNumber.includes(searchQuery) ||
      b.utrNumber.includes(searchQuery) ||
      b.eventTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const paginatedBookings = filteredBookings.slice(0, visibleLimit);

  // ==========================================
  // PASSCODE AUTHENTICATION GATE
  // ==========================================
  if (authLoading) {
    return <LoadingSpinner message="Securing connection..." fullPage />;
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-slate-950 min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(197,29,52,0.1),transparent_60%)]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-8 border border-white/5 space-y-6 relative z-10"
        >
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-blaugrana-gradient border border-gold/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Admin Gateway</h2>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold text-glow-gold">FCB Guwahati Command Center</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@fcbguwahati.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="passcode" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Secret Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="passcode"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                />
              </div>
              {authError && (
                <p className="text-xs text-rose-500 font-semibold">{authError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3.5 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl transition-all duration-300 hover:scale-102 border-glow-gold text-sm uppercase tracking-wider"
            >
              Log In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // MAIN ADMIN DASHBOARD INTERFACE
  // ==========================================
  return (
    <div className="w-full bg-dark-gradient min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Lightbox for Payment Screenshots */}
      <AnimatePresence>
        {activeScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveScreenshot(null)}
            className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden p-1"
            >
              <div className="relative w-full h-[65vh] mx-auto">
                <Image
                  src={activeScreenshot}
                  alt="Payment Screen Check"
                  fill
                  unoptimized
                  className="object-contain rounded-xl"
                />
              </div>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-slate-950 text-white rounded-xl border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {editingEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingEvent(null)}
            className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-2xl w-full p-6 sm:p-8 border border-white/10 my-8 relative z-50 text-left"
            >
              <div className="border-b border-white/5 pb-4 mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit2 className="w-5 h-5 text-gold" />
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Edit Club Event</h2>
                </div>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateEventSubmit} className="space-y-5">
                {/* Grid row 1: Title & Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label htmlFor="editEventTitle" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Event Match Title
                    </label>
                    <input
                      id="editEventTitle"
                      type="text"
                      required
                      placeholder="FC Barcelona vs Real Madrid"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editEventType" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Event Type
                    </label>
                    <select
                      id="editEventType"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl glass-input bg-slate-900 border border-white/8 text-white font-bold"
                    >
                      <option value="screening">Match Screening</option>
                      <option value="turf">Turf Football Session</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="editEventDesc" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Description & Fan Notes
                  </label>
                  <textarea
                    id="editEventDesc"
                    required
                    rows={3}
                    placeholder="Add event details..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium"
                  />
                </div>

                {/* Venue */}
                <div className="space-y-1.5">
                  <label htmlFor="editEventVenue" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Venue Address
                  </label>
                  <input
                    id="editEventVenue"
                    type="text"
                    required
                    placeholder="Venue Address"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium"
                  />
                </div>

                {/* Date, Time, Price, Seats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="editEventDate" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Date
                    </label>
                    <input
                      id="editEventDate"
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editEventTime" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Kickoff Time (IST)
                    </label>
                    <input
                      id="editEventTime"
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editEventPrice" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Price (INR)
                    </label>
                    <input
                      id="editEventPrice"
                      type="number"
                      min="0"
                      required
                      placeholder="₹250"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editEventMaxSeats" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Max Capacity
                    </label>
                    <input
                      id="editEventMaxSeats"
                      type="number"
                      min="1"
                      required
                      placeholder="150"
                      value={editMaxSeats}
                      onChange={(e) => setEditMaxSeats(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl glass-input font-medium text-white"
                    />
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Event Cover Banner
                  </label>
                  <div className="relative">
                    {editBannerPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2 flex items-center justify-between">
                        <Image
                          src={editBannerPreview}
                          alt="Banner Preview"
                          width={100}
                          height={60}
                          unoptimized
                          className="object-cover rounded-xl border border-white/5"
                        />
                        <span className="text-xs text-slate-400 max-w-[200px] truncate pr-4 font-medium">
                          {editBannerFile ? editBannerFile.name : "Current Banner Image"}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setEditBannerFile(null); setEditBannerPreview(null); }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all duration-300 mr-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-white/10 hover:border-gold/30 rounded-2xl bg-white/3 cursor-pointer transition-all duration-300">
                        <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Select New Cover</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditBannerChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all duration-300 text-sm uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingEvent}
                    className="flex-grow py-3 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl shadow-lg border-glow-gold transition-all duration-300 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingEvent ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/60 p-6 rounded-3xl border border-white/5 gap-4 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blaugrana-gradient border border-gold/30 rounded-2xl shadow-lg">
              <BarChart2 className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Control Panel & Event Manager</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboardData}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-5 py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Revenue card */}
          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">₹{totalRevenue}</div>
            <p className="text-[10px] text-muted-foreground">Verified transactions only</p>
          </div>

          {/* Tickets sold card */}
          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Tickets Issued</span>
              <Ticket className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{totalTicketsSold} Passes</div>
            <p className="text-[10px] text-muted-foreground">Verified tickets issued</p>
          </div>

          {/* Pending tickets card */}
          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Pending Check</span>
              <Info className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{pendingBookings.length} Requests</div>
            <p className="text-[10px] text-muted-foreground">Requires manual verify</p>
          </div>

          {/* Active events card */}
          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Active Calendars</span>
              <Calendar className="w-5 h-5 text-gold" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{events.length} Events</div>
            <p className="text-[10px] text-muted-foreground">Screenings & Turf matches</p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-white/5 space-x-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-b-2 relative ${
              activeTab === "bookings" 
                ? "text-gold border-gold" 
                : "text-muted-foreground border-transparent hover:text-white"
            }`}
          >
            Bookings Checklist ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("manage-events")}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-b-2 relative ${
              activeTab === "manage-events" 
                ? "text-gold border-gold" 
                : "text-muted-foreground border-transparent hover:text-white"
            }`}
          >
            Manage Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("gate-scanner")}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-b-2 relative ${
              activeTab === "gate-scanner" 
                ? "text-gold border-gold" 
                : "text-muted-foreground border-transparent hover:text-white"
            }`}
          >
            Gate Scanner
          </button>
          <button
            onClick={() => setActiveTab("create-event")}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-b-2 relative ${
              activeTab === "create-event" 
                ? "text-gold border-gold" 
                : "text-muted-foreground border-transparent hover:text-white"
            }`}
          >
            Publish New Event
          </button>
        </div>

        {/* TAB PANELS */}
        {loading ? (
          <LoadingSpinner message="Consulting server tables..." />
        ) : (
          <div>
            
            {/* PANEL 1: BOOKINGS LIST */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                {/* Filters & Search Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Bookings Filters */}
                  <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl w-full md:max-w-md">
                    {[
                      { id: "all", label: "All" },
                      { id: "pending", label: "Pending" },
                      { id: "confirmed", label: "Confirmed" },
                      { id: "rejected", label: "Rejected" }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setBookingFilter(filter.id)}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                          bookingFilter === filter.id
                            ? "bg-white/10 text-gold border border-gold/25"
                            : "text-muted-foreground hover:text-white"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <div className="relative w-full md:max-w-xs">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search name, phone, UTR..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl glass-input font-medium"
                    />
                  </div>
                </div>

                {/* Bookings Table */}
                {filteredBookings.length === 0 ? (
                  <div className="glass-card p-16 text-center rounded-3xl border border-white/5">
                    <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Bookings Found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      No records matched the &quot;{bookingFilter}&quot; state filter.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {paginatedBookings.map((booking) => {
                      const isPending = booking.bookingStatus === "pending";
                      const isConfirmed = booking.bookingStatus === "confirmed";
                      const isRejected = booking.bookingStatus === "rejected";

                      return (
                        <div 
                          key={booking.id}
                          className="glass-card p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6 border border-white/5"
                        >
                          {/* Left Column: User, Event & Ticket info */}
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center space-x-2.5">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                                isConfirmed 
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                  : isRejected
                                  ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                              }`}>
                                {booking.bookingStatus}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                Received {new Date(booking.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Customer Details */}
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Subscriber</div>
                                <div className="text-base font-extrabold text-white flex items-center space-x-1.5">
                                  <User className="w-4 h-4 text-gold flex-shrink-0" />
                                  <span>{booking.userName}</span>
                                </div>
                                <div className="text-sm text-slate-300 flex items-center space-x-1.5 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <a href={`https://wa.me/${booking.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center space-x-0.5">
                                    <span>{booking.phoneNumber}</span>
                                  </a>
                                </div>
                              </div>

                              {/* Booking Details */}
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Event & Passes</div>
                                <div className="text-sm font-extrabold text-white line-clamp-1">{booking.eventTitle}</div>
                                <div className="text-xs text-slate-300 font-semibold flex items-center space-x-1.5">
                                  <Ticket className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <span>{booking.numberOfTickets} Passes • </span>
                                  <span className="text-gold font-bold">₹{booking.totalAmount}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle Column: UTR & Lightbox Trigger */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-shrink-0">
                            {/* UTR Check */}
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">UPI UTR Ref</span>
                              <span className="font-mono text-sm font-bold text-white bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5 select-all">
                                {booking.utrNumber}
                              </span>
                            </div>

                            {/* Screenshot view button */}
                            {booking.screenshotUrl ? (
                              <button
                                onClick={() => setActiveScreenshot(booking.screenshotUrl)}
                                className="group relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex-shrink-0 flex items-center justify-center cursor-zoom-in"
                              >
                                <Image
                                  src={booking.screenshotUrl}
                                  alt="Receipt preview"
                                  width={64}
                                  height={64}
                                  unoptimized
                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                />
                                <Eye className="absolute w-4 h-4 text-white drop-shadow opacity-60 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ) : (
                              <div className="w-16 h-16 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-[10px] text-muted-foreground font-semibold text-center leading-none p-1">
                                No receipt
                              </div>
                            )}
                          </div>

                          {/* Right Column: Verification Actions */}
                          <div className="flex items-center space-x-3 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0 flex-shrink-0 justify-end">
                            {isConfirmed && (
                              <div className="flex items-center space-x-2 mr-2">
                                <button
                                  onClick={() => handleSendWhatsApp(booking)}
                                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-lg shadow-emerald-950/20"
                                  title="Send ticket pass link to user via WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-black" />
                                  <span>Send Pass</span>
                                </button>
                                
                                {booking.checkedIn ? (
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] text-yellow-400 font-extrabold bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-xl">
                                      ✓ Checked In
                                    </span>
                                    <button
                                      disabled={checkInActionLoading === booking.id}
                                      onClick={() => handleCheckInStatusUpdate(booking.id, false)}
                                      className="text-[10px] text-rose-500 hover:underline"
                                      title="Reset attendee check-in status"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={checkInActionLoading === booking.id}
                                    onClick={() => handleCheckInStatusUpdate(booking.id, true)}
                                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-all"
                                    title="Manually mark attendee as checked in at gate"
                                  >
                                    Check In
                                  </button>
                                )}
                              </div>
                            )}
                            {isPending ? (
                              <>
                                <button
                                  disabled={actionLoading !== null}
                                  onClick={() => handleStatusUpdate(booking.id, "rejected")}
                                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all duration-300"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  disabled={actionLoading !== null}
                                  onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-102 shadow-lg shadow-emerald-950/20"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              </>
                            ) : (
                              <div className="text-xs font-bold text-muted-foreground flex items-center space-x-2">
                                <span>Checked by Admin</span>
                                {isConfirmed ? (
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, "rejected")}
                                    className="text-xs text-rose-500/70 hover:text-rose-500 hover:underline"
                                    title="Mark status as rejected instead"
                                  >
                                    (Revoke)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                    className="text-xs text-emerald-500/70 hover:text-emerald-500 hover:underline"
                                    title="Mark status as confirmed instead"
                                  >
                                    (Approve)
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredBookings.length > visibleLimit && (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => setVisibleLimit((prev) => prev + 10)}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider"
                        >
                          Load More Bookings
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PANEL 2: MANAGE EVENTS LIST */}
            {activeTab === "manage-events" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => {
                    const booked = event.maxSeats - event.remainingSeats;
                    const percentBooked = Math.min(100, Math.round((booked / event.maxSeats) * 100));

                    return (
                      <div 
                        key={event.id}
                        className="glass-card p-6 flex flex-col md:flex-row gap-6 border border-white/5 relative overflow-hidden"
                      >
                        {/* Event Banner preview on the left */}
                        {event.bannerImage && (
                          <div className="relative w-full md:w-32 h-24 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                            <Image
                              src={event.bannerImage}
                              alt={event.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Event Details */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                event.type === "screening" 
                                  ? "border-gold/20 bg-gold/10 text-gold" 
                                  : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                              }`}>
                                {event.type || "screening"}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Price: ₹{event.price}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-white line-clamp-1 mt-1">{event.title}</h3>
                            <p className="text-xs text-slate-300 font-medium">
                              📅 {event.date} • 🕒 {event.time}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              📍 {event.venue}
                            </p>
                          </div>

                          {/* Capacity progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Capacity: {booked} / {event.maxSeats} Booked</span>
                              <span>{event.remainingSeats} left</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-gold rounded-full" 
                                style={{ width: `${percentBooked}%` }}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 pt-2">
                            <button
                              onClick={() => handleStartEdit(event)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold transition-all duration-300"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gold" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteEventClick(event.id, event.title)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all duration-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PANEL: GATE SCANNER */}
            {activeTab === "gate-scanner" && (
              <div className="max-w-2xl mx-auto space-y-6 animate-pulse-once">
                <div className="glass-card p-6 sm:p-8 border border-white/5 space-y-6">
                  <div className="border-b border-white/5 pb-4 flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Gate Entry Scanner</h2>
                  </div>

                  {/* Manual input / USB scanner input */}
                  <div className="space-y-2">
                    <label htmlFor="scanInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Scan QR Code or Enter Ticket ID
                    </label>
                    <div className="flex space-x-3">
                      <input
                        id="scanInput"
                        type="text"
                        placeholder="Scan QR or paste booking reference ID here"
                        value={scanIdInput}
                        onChange={(e) => setScanIdInput(e.target.value)}
                        className="flex-1 px-4 py-3 text-sm rounded-xl glass-input font-medium text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleManualScanSubmit();
                        }}
                      />
                      <button
                        onClick={handleManualScanSubmit}
                        className="px-6 py-3 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all"
                      >
                        Verify
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Tip: If you use a physical USB QR scanner, focus on this input field and scan the ticket QR.
                    </p>
                  </div>

                  {/* Scanned result display */}
                  <AnimatePresence mode="wait">
                    {scannedBooking ? (
                      <motion.div
                        key={scannedBooking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-6 rounded-2xl border ${
                          scannedBooking.checkedIn
                            ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
                            : scannedBooking.bookingStatus === "confirmed"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/5 text-rose-400"
                        } space-y-4`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest block text-slate-400">Attendee Details</span>
                            <h3 className="text-lg font-black text-white mt-1">{scannedBooking.userName}</h3>
                            <p className="text-xs text-slate-300 font-medium">📞 {scannedBooking.phoneNumber}</p>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded border ${
                            scannedBooking.checkedIn
                              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                              : scannedBooking.bookingStatus === "confirmed"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          }`}>
                            {scannedBooking.checkedIn ? "Checked In" : scannedBooking.bookingStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase font-bold tracking-wider text-[9px] block">Event Match</span>
                            <span className="text-white font-extrabold mt-0.5 block">{scannedBooking.eventTitle}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase font-bold tracking-wider text-[9px] block">Pass Quantity</span>
                            <span className="text-white font-extrabold mt-0.5 block">{scannedBooking.numberOfTickets} Passes</span>
                          </div>
                        </div>

                        {/* Scanner Actions */}
                        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          {scannedBooking.checkedIn ? (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-yellow-400">
                                ⚠️ ACCESS DENIED - ALREADY IN VENUE
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Scanned at {new Date(scannedBooking.checkedInAt).toLocaleString()}
                              </p>
                            </div>
                          ) : scannedBooking.bookingStatus === "confirmed" ? (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-emerald-400">
                                ✓ ACCESS GRANTED - CONFIRMED PASS
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Ticket UTR: {scannedBooking.utrNumber}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-rose-500">
                                ❌ ACCESS DENIED - TICKET IS {scannedBooking.bookingStatus.toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Verify receipt manual check status.
                              </p>
                            </div>
                          )}

                          {scannedBooking.bookingStatus === "confirmed" && (
                            <div>
                              {scannedBooking.checkedIn ? (
                                <button
                                  onClick={() => handleScannerCheckInUpdate(scannedBooking.id, false)}
                                  className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all animate-pulse-once"
                                >
                                  Reset Entry
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleScannerCheckInUpdate(scannedBooking.id, true)}
                                  className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all hover:scale-102 border-glow-gold"
                                >
                                  Check In Culé
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center text-slate-500 font-semibold"
                      >
                        Enter or scan a ticket ID to verify attendee entry.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* PANEL 3: CREATE EVENT FORM */}
            {activeTab === "create-event" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card max-w-3xl mx-auto p-6 sm:p-8 border border-white/5"
              >
                <div className="border-b border-white/5 pb-4 mb-6 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-gold" />
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Create Club Event</h2>
                </div>

                <form onSubmit={handleCreateEventSubmit} className="space-y-6">
                  {/* Grid row 1: Title & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="eventTitle" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Event Match Title
                      </label>
                      <input
                        id="eventTitle"
                        type="text"
                        required
                        placeholder="FC Barcelona vs Real Madrid - El Clásico"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="eventType" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Event Type
                      </label>
                      <select
                        id="eventType"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl glass-input bg-slate-900 border border-white/8 text-white font-bold"
                      >
                        <option value="screening">Match Screening</option>
                        <option value="turf">Turf Football Session</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="eventDesc" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Description & Fan Notes
                    </label>
                    <textarea
                      id="eventDesc"
                      required
                      rows={4}
                      placeholder="Add event details: screening conditions, F&B offers, rules for turf session, footwear..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>

                  {/* Venue */}
                  <div className="space-y-2">
                    <label htmlFor="eventVenue" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Venue Address
                    </label>
                    <input
                      id="eventVenue"
                      type="text"
                      required
                      placeholder="e.g. Underdog Sports Bar, Zoo Road, Guwahati"
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>

                  {/* Date, Time, Price, Seats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="eventDate" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Date
                      </label>
                      <input
                        id="eventDate"
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="eventTime" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Kickoff Time (IST)
                      </label>
                      <input
                        id="eventTime"
                        type="time"
                        required
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="eventPrice" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Price (INR)
                      </label>
                      <input
                        id="eventPrice"
                        type="number"
                        min="0"
                        required
                        placeholder="₹250"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="eventMaxSeats" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Max Capacity Slots
                      </label>
                      <input
                        id="eventMaxSeats"
                        type="number"
                        min="1"
                        required
                        placeholder="150"
                        value={eventMaxSeats}
                        onChange={(e) => setEventMaxSeats(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl glass-input font-medium text-white"
                      />
                    </div>
                  </div>

                  {/* Banner Image Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Event Cover Banner
                    </label>
                    <div className="relative">
                      {eventBannerPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2 flex items-center justify-between">
                          <Image
                            src={eventBannerPreview}
                            alt="Banner Preview"
                            width={128}
                            height={80}
                            unoptimized
                            className="object-cover rounded-xl border border-white/5"
                          />
                          <span className="text-xs text-slate-400 max-w-[200px] truncate pr-4 font-medium">
                            {eventBannerFile?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setEventBannerFile(null); setEventBannerPreview(null); }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all duration-300 mr-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/10 hover:border-gold/30 rounded-2xl bg-white/3 cursor-pointer transition-all duration-300">
                          <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Select Banner Cover</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Recommended 16:9 ratio, PNG, JPG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            className="hidden"
                            required
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Publish Button */}
                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="w-full py-4 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-2xl shadow-lg border-glow-gold transition-all duration-300 flex items-center justify-center space-x-2 text-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingEvent ? (
                      <span>Publishing Calendar...</span>
                    ) : (
                      <>
                        <span>Publish Event Live</span>
                        <Check className="w-5 h-5 text-black" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
