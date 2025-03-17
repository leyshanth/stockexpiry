"use client";

import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <ProtectedRoute>
      <div className="pb-20">
        <header className="bg-white dark:bg-slate-800 p-4 shadow">
          <h1 className="text-2xl font-bold">About</h1>
        </header>

        <main className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                About Stock Expiry Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-medium">Developer</p>
                <p>Leyshanth</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium">About the App</p>
                <p className="text-gray-700 dark:text-gray-300">
                  My name is Leyshanth, and I developed this app to provide an easy and efficient 
                  solution for tracking product expiry dates, specifically designed for retail stores. 
                  This app not only simplifies expiry management but also helps ensure compliance with 
                  industry standards and regulations, making day-to-day operations smoother and more reliable.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium">Features</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Barcode scanning for quick product identification</li>
                  <li>Expiry date tracking and notifications</li>
                  <li>Product database management</li>
                  <li>Deleted items recovery</li>
                  <li>User-friendly interface</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium">Technologies Used</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Next.js</li>
                  <li>TypeScript</li>
                  <li>PostgreSQL</li>
                  <li>Tailwind CSS</li>
                  <li>NextAuth.js</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-center text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} Stock Expiry Tracker. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>

        <Navbar />
      </div>
    </ProtectedRoute>
  );
} 