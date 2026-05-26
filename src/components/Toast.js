"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={toast} onClose={removeToast} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastItem = ({ toast, onClose }) => {
  const { id, message, type } = toast;

  const styles = {
    success: {
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/5",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
    },
    error: {
      border: "border-rose-500/20",
      glow: "shadow-rose-500/5",
      icon: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
    },
    info: {
      border: "border-blue-500/20",
      glow: "shadow-blue-500/5",
      icon: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border bg-slate-950/95 backdrop-blur-lg shadow-xl ${currentStyle.border} ${currentStyle.glow}`}>
      {currentStyle.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100 break-words pr-2">{message}</p>
      </div>
      <button 
        onClick={() => onClose(id)} 
        className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/5 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
