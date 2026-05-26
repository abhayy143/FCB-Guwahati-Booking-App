"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Mail, User, Phone, Check, LogIn, UserPlus, ArrowLeft
} from "lucide-react";
import { 
  auth 
} from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import { saveUserProfile, fetchUserProfile } from "@/lib/services";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

// Custom Google Icon Component since lucide doesn't export a Google logo
function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const redirectUrl = searchParams.get("redirect") || "/events";

  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Check if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Logged in already, redirect away
        router.push(redirectUrl);
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router, redirectUrl]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Signed in successfully!", "success");
      router.push(redirectUrl);
    } catch (err) {
      console.error(err);
      let message = "Failed to log in. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many login attempts. Please try again later.";
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter your name", "error");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      showToast("Please enter a valid 10-digit WhatsApp number", "error");
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save profile info in Firestore
      await saveUserProfile(user.uid, {
        name,
        phoneNumber,
        email: user.email
      });

      showToast("Account created successfully!", "success");
      router.push(redirectUrl);
    } catch (err) {
      console.error(err);
      let message = "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters.";
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user already has profile in Firestore
      const profile = await fetchUserProfile(user.uid);
      if (!profile) {
        // Initialize profile
        await saveUserProfile(user.uid, {
          name: user.displayName || "Culé Member",
          phoneNumber: "", // Empty for now, will ask during booking checkout
          email: user.email
        });
        showToast("Welcome to FCB Guwahati!", "success");
      } else {
        showToast(`Welcome back, ${profile.name || "Culé"}!`, "success");
      }

      router.push(redirectUrl);
    } catch (err) {
      console.error(err);
      showToast("Google Sign-In failed or cancelled.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return <LoadingSpinner message="Checking connection..." fullPage />;
  }

  return (
    <div className="w-full bg-slate-950 min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Radial Light Effect */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(197,29,52,0.12),transparent_60%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(13,30,61,0.2),transparent_50%)]" />

      {loading && <LoadingSpinner message="Authenticating credentials..." fullPage />}

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Return Button */}
        <Link
          href="/events"
          className="inline-flex items-center space-x-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Calendars</span>
        </Link>

        {/* Crest & Banner Card */}
        <div className="glass-card p-8 border border-white/5 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blaugrana-gradient border border-gold/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-gold font-black tracking-tighter text-xl">FCB</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Culé Member Login</h2>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold text-glow-gold">FCB Guwahati Booking Hub</p>
          </div>

          {/* Switch tab buttons */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                activeTab === "login"
                  ? "bg-white/10 text-gold border border-gold/25"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                activeTab === "register"
                  ? "bg-white/10 text-gold border border-gold/25"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* LOGIN FORM */}
            {activeTab === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="login-password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl transition-all duration-300 hover:scale-102 border-glow-gold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 mt-6"
                >
                  <span>Log In</span>
                  <LogIn className="w-4 h-4 text-black" />
                </button>
              </motion.form>
            )}

            {/* REGISTER FORM */}
            {activeTab === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                {/* Full name */}
                <div className="space-y-2">
                  <label htmlFor="reg-name" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="Abhay Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>
                </div>

                {/* WhatsApp number */}
                <div className="space-y-2">
                  <label htmlFor="reg-phone" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="reg-phone"
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
                    Matches will be linked to this number for entry verification.
                  </p>
                </div>

                {/* Email address */}
                <div className="space-y-2">
                  <label htmlFor="reg-email" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="reg-password" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Password (Min 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gold hover:bg-gold/90 text-black font-extrabold rounded-xl transition-all duration-300 hover:scale-102 border-glow-gold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 mt-6"
                >
                  <span>Create Account</span>
                  <UserPlus className="w-4 h-4 text-black" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Social Sign-In Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-900/80 border border-white/10 text-white rounded-xl font-bold transition-all duration-300 hover:scale-102 text-xs uppercase tracking-wider flex items-center justify-center space-x-2.5"
          >
            <GoogleIcon className="w-5 h-5 text-white flex-shrink-0" />
            <span>Sign In with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Preparing secure login portal..." fullPage />}>
      <LoginContent />
    </Suspense>
  );
}
