"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("ProtectedRoute - Session status:", status, "Session:", session);
    
    if (status === "loading") {
      return; // Wait for the session to load
    }
    
    setIsLoading(false);
    
    if (!session) {
      console.log("No session found, redirecting to login page");
      router.push("/login");
      
      // Force a hard navigation if router.push doesn't work
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          console.log("Forcing navigation to login page");
          window.location.href = "/login";
        }
      }, 500);
    }
  }, [session, status, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
} 