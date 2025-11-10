import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Router from "./router";
import { apiClient } from "@/lib/api";

const App = () => {
  useEffect(() => {
    // Use BACKEND_URL for Render, fallback to VITE_API_BASE_URL or localhost
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const intervalSeconds = 300; // 5 minutes

    const pingBackend = async () => {
      try {
        await fetch(`${backendUrl}/health`);
      } catch (_) {
        // Silently ignore errors
      }
    };

    pingBackend();
    const id = setInterval(pingBackend, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Toaster />
      <Router />
    </>
  );
};

export default App;
