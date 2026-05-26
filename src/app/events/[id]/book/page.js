"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Ticket, User, Phone, Check, CreditCard, 
  Copy, Image as ImageIcon, CheckCircle2, ShieldAlert, Sparkles, Smartphone 
} from "lucide-react";
import { fetchEventById, createBooking, uploadFile, fetchUserProfile, saveUserProfile } from "@/lib/services";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const MOCK_EVENTS = {
  "mock-clasico": {
    id: "mock-clasico",
    title: "FC Barcelona vs Real Madrid - El Clásico Screening",
    type: "screening",
    price: 250,
    remainingSeats: 120,
    bannerImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
  },
  "mock-turf": {
    id: "mock-turf",
    title: "Weekly Turf Football - Culés Matchday",
    type: "turf",
    price: 150,
    remainingSeats: 8,
    bannerImage: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80"
  }
};

export default function BookEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Stepper state: 1 = Details, 2 = Payment & Upload, 3 = Success
  const [step, setStep] = useState(1);

  // Form states
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const [bookingId, setBookingId] = useState("");

  // Authenticate and Prefill Profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        showToast("Please sign in to register a match pass.", "info");
        router.push(`/login?redirect=/events/${id}/book`);
      } else {
        setUser(currentUser);
        try {
          const profile = await fetchUserProfile(currentUser.uid);
          if (profile) {
            if (profile.name) setUserName(profile.name);
            if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
          } else {
            if (currentUser.displayName) setUserName(currentUser.displayName);
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [id, router, showToast]);

  useEffect(() => {
    async function loadEvent() {
      try {
        if (id.startsWith("mock-")) {
          const mockData = MOCK_EVENTS[id];
          if (mockData) {
            setEvent(mockData);
          } else {
            setError("Event details unavailable");
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
        console.error(err);
        setError("Failed to fetch event details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadEvent();
  }, [id]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      showToast("Please enter a valid 10-digit WhatsApp number", "error");
      return;
    }
    if (numberOfTickets < 1 || numberOfTickets > event.remainingSeats) {
      showToast(`Invalid quantity. Max available: ${event.remainingSeats}`, "error");
      return;
    }
    setStep(2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyUPI = () => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || "fcbguwahati@upi";
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    showToast("UPI ID copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(utrNumber)) {
      showToast("UTR/Transaction Reference must be exactly 12 digits", "error");
      return;
    }
    if (!screenshotFile) {
      showToast("Please upload payment confirmation screenshot", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Update profile with phone number if it wasn't saved before
      try {
        await saveUserProfile(user.uid, {
          name: userName,
          phoneNumber: phoneNumber,
          email: user.email
        });
      } catch (profileErr) {
        console.error("Failed to save user profile details", profileErr);
      }

      // 1. Upload screenshot file to Firebase Storage
      let screenshotUrl = "";
      try {
        screenshotUrl = await uploadFile(screenshotFile, "screenshots");
      } catch (uploadErr) {
        console.error("Storage upload failed, attempting default placeholder URL", uploadErr);
        screenshotUrl = "https://images.unsplash.com/photo-1557683316-973673baf926?w=600";
      }

      // 2. Write booking structure into Firestore
      const totalAmount = numberOfTickets * event.price;
      const bId = await createBooking({
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        userName,
        phoneNumber,
        numberOfTickets,
        totalAmount,
        utrNumber,
        screenshotUrl
      });

      setBookingId(bId);
      setStep(3);
      showToast("Booking request registered successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to submit booking. Check network connection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking || loading) return <LoadingSpinner message="Generating passes..." fullPage />;

  if (error || !event) {
    return (
      <div className="w-full bg-dark-gradient min-h-screen flex flex-col items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-white/5">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-white">Checkout Error</h2>
          <p className="text-muted-foreground text-sm">{error || "Event not found"}</p>
          <button
            onClick={() => router.push("/events")}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10"
          >
            Return to Calendars
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = numberOfTickets * event.price;
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "fcbguwahati@upi";
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || "FCB Guwahati";
  const isMerchant = process.env.NEXT_PUBLIC_UPI_MERCHANT === "true";
  const staticQrUrl = process.env.NEXT_PUBLIC_UPI_QR_IMAGE || "";
  
  // Format UPI URL schema: merchant vs personal P2P
  const upiDeepLink = isMerchant 
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`FCB Ghy: ${event.title.substring(0, 15)}`)}`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR`;

  // Use static QR image if configured, otherwise fall back to generating a dynamic QR
  const qrCodeUrl = staticQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0d1e3d&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="w-full bg-dark-gradient min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {submitting && <LoadingSpinner message="Uploading receipts & locking seats..." fullPage />}
      
      <div className="max-w-xl w-full">
        {/* Back control */}
        {step < 3 && (
          <button
            onClick={() => step === 2 ? setStep(1) : router.push(`/events/${event.id}`)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-white transition-colors mb-6 text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step === 2 ? "Back to Details" : "Back to Event"}</span>
          </button>
        )}

        {/* Card wrapper */}
        <div className="glass-card overflow-hidden rounded-3xl border border-white/5 shadow-2xl relative">
          
          {/* Header indicator */}
          <div className="bg-slate-900/80 border-b border-white/5 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-gold uppercase tracking-wider font-extrabold">Checkout booking</span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight line-clamp-1">
                {event.title}
              </h2>
            </div>
            
            {/* Step badges */}
            {step < 3 && (
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-white/5 text-[10px] sm:text-xs font-bold text-slate-400">
                <span className={`px-2 py-1.5 rounded-lg ${step === 1 ? "bg-gold text-black font-extrabold" : ""}`}>1. Info</span>
                <span className={`px-2 py-1.5 rounded-lg ${step === 2 ? "bg-gold text-black font-extrabold" : ""}`}>2. Pay</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: FORM INFORMATION */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleNextStep}
                  className="space-y-6"
                >
                  {/* Name field */}
                  <div className="space-y-2">
                    <label htmlFor="userName" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        id="userName"
                        type="text"
                        required
                        placeholder="Abhay Sharma"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        id="phoneNumber"
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Pass receipts and entry codes will be sent to this WhatsApp contact.
                    </p>
                  </div>

                  {/* Tickets counter */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Number of Passes
                      </label>
                      <span className="text-xs font-extrabold text-gold uppercase tracking-wider">
                        ₹{event.price} / Ticket
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center space-x-1.5">
                        <Ticket className="w-5 h-5 text-gold" />
                        <span className="text-sm font-semibold text-slate-200">Select Quantity</span>
                      </div>
                      
                      {/* Counter Controls */}
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          disabled={numberOfTickets <= 1}
                          onClick={() => setNumberOfTickets(numberOfTickets - 1)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black flex items-center justify-center border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed select-none"
                        >
                          -
                        </button>
                        <span className="text-lg font-black text-white w-4 text-center">{numberOfTickets}</span>
                        <button
                          type="button"
                          disabled={numberOfTickets >= Math.min(10, event.remainingSeats)}
                          onClick={() => setNumberOfTickets(numberOfTickets + 1)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black flex items-center justify-center border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>Subtotal ({numberOfTickets} Tickets)</span>
                      <span>₹{numberOfTickets * event.price}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>Convenience / Service Fee</span>
                      <span className="text-emerald-400 font-extrabold">₹0 (Free)</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-sm font-bold text-white">Total Amount</span>
                      <span className="text-2xl font-black text-gold">₹{totalAmount}</span>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-2xl shadow-lg border-glow-gold transition-all duration-300 flex items-center justify-center space-x-2 text-md"
                  >
                    <span>Proceed to Payment</span>
                    <CreditCard className="w-5 h-5 text-black" />
                  </button>
                </motion.form>
              )}

              {/* STEP 2: PAYMENT & VERIFICATION DETAILS */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleSubmitBooking}
                  className="space-y-6"
                >
                  {/* Dynamic QR & instructions */}
                  <div className="flex flex-col items-center justify-center space-y-4 py-2 border-b border-white/5">
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {isMerchant ? "Scan and pay exact amount" : "Scan QR & Enter Exact Amount"}
                      </p>
                      <div className="text-3xl font-black text-gold">₹{totalAmount}</div>
                      {!isMerchant && (
                        <p className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-wide bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 max-w-[280px] mx-auto mt-1 animate-pulse">
                          ⚠️ Enter ₹{totalAmount} manually in your UPI app
                        </p>
                      )}
                    </div>

                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-2xl border-4 border-slate-900 shadow-inner">
                      <Image
                        src={qrCodeUrl}
                        alt="UPI Payment QR Code"
                        width={160}
                        height={160}
                        unoptimized
                        className="object-contain"
                      />
                    </div>

                    {/* Mobile Deep Link Shortcut */}
                    <a
                      href={upiDeepLink}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-bold border border-blue-500/20 hover:scale-102 transition-all duration-300 md:hidden"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Pay with UPI Apps</span>
                    </a>
                  </div>

                  {/* UPI Copy details */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Pay to UPI ID
                    </label>
                    <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-white/5">
                      <span className="text-sm font-extrabold text-white tracking-wider">{upiId}</span>
                      <button
                        type="button"
                        onClick={copyUPI}
                        className="flex items-center space-x-1.5 text-xs text-gold font-bold hover:text-white transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* UTR Input */}
                  <div className="space-y-2">
                    <label htmlFor="utrNumber" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      12-Digit UPI UTR / Txn ID
                    </label>
                    <input
                      id="utrNumber"
                      type="text"
                      required
                      placeholder="e.g. 612345678901"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      className="w-full px-4 py-3 text-sm rounded-xl glass-input font-mono font-medium tracking-widest text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">
                      UTR is a unique 12-digit code starting with 3, 4, 5, or 6 found on your payment receipt.
                    </p>
                  </div>

                  {/* Image upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Upload Payment Screenshot
                    </label>
                    <div className="relative">
                      {screenshotPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2 flex items-center justify-between">
                          <Image
                            src={screenshotPreview}
                            alt="Screenshot Preview"
                            width={64}
                            height={64}
                            unoptimized
                            className="object-cover rounded-xl border border-white/5"
                          />
                          <span className="text-xs text-slate-400 max-w-[200px] truncate pr-4 font-medium">
                            {screenshotFile?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all duration-300 mr-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-white/10 hover:border-gold/30 rounded-2xl bg-white/3 cursor-pointer transition-all duration-300">
                          <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Select Receipt Image</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            required
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-2xl shadow-lg border-glow-gold transition-all duration-300 flex items-center justify-center space-x-2 text-md"
                  >
                    <span>Submit Booking</span>
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  </button>
                </motion.form>
              )}

              {/* STEP 3: SUCCESS CONFIRMATION RECEIPT */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-6"
                >
                  {/* Success animation */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <Check className="w-10 h-10 text-emerald-400" />
                    <motion.div 
                      className="absolute inset-0 border border-emerald-500 rounded-full" 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>

                  {/* Success Headers */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">Booking Submitted!</h3>
                    <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                      Verification is currently pending. An admin will check the transaction details shortly.
                    </p>
                  </div>

                  {/* Receipt breakdown */}
                  <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 space-y-4 text-left max-w-sm mx-auto text-sm font-medium">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Booking ID</span>
                      <span className="font-mono text-white select-all">{bookingId.substring(0, 8).toUpperCase()}...</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Name</span>
                      <span className="text-white">{userName}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Tickets Booked</span>
                      <span className="text-white">{numberOfTickets} Passes</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="text-gold font-bold">₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-yellow-400 font-extrabold uppercase text-xs tracking-wider bg-yellow-500/10 px-2.5 py-0.5 rounded-lg border border-yellow-500/20">Pending</span>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-xs mx-auto pt-4">
                    <Link
                      href="/events"
                      className="w-full block py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all duration-300 text-sm"
                    >
                      Browse More Events
                    </Link>
                    <Link
                      href="/"
                      className="w-full block py-3 text-muted-foreground hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
                    >
                      Return to Home
                    </Link>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
