"use client";

import { useEffect } from "react";

export function DatabaseInitializer() {
  useEffect(() => {
    // Initialize the database
    fetch("/api/init-db")
      .then(response => response.json())
      .then(data => {
        console.log("Database initialization:", data);
      })
      .catch(error => {
        console.error("Error initializing database:", error);
      });
  }, []);

  // This component doesn't render anything
  return null;
} 