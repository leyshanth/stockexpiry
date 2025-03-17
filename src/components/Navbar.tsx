"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Calendar, Settings, LogOut, Menu, X, Trash, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function Navbar() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Side Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMenu(false)}></div>
      )}
      
      {/* Side Menu */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-slate-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          showMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowMenu(false)}>
            <X size={20} />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <Link 
            href="/settings/profile" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowMenu(false)}
          >
            <Settings size={20} className="mr-2" />
            <span>Settings</span>
          </Link>
          <Link 
            href="/deleted" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowMenu(false)}
          >
            <Trash size={20} className="mr-2" />
            <span>Deleted Items</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-red-500"
          >
            <LogOut size={20} className="mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 z-10">
        <div className="flex justify-around items-center h-16">
          <Link href="/home" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/home') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link href="/products" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/products') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <Package size={24} />
            <span className="text-xs mt-1">Products</span>
          </Link>
          
          <Link href="/expiry" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/expiry') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <Clock size={24} />
            <span className="text-xs mt-1">Add Expiry</span>
          </Link>
          
          <Link href="/deleted" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/deleted') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <Trash size={24} />
            <span className="text-xs mt-1">Deleted</span>
          </Link>
          
          <Link href="/about" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/about') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <Info size={24} />
            <span className="text-xs mt-1">About</span>
          </Link>
          
          <button 
            className="flex flex-col items-center justify-center w-full"
            onClick={() => setShowMenu(true)}
          >
            <div className="flex flex-col items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400">
              <Menu size={20} />
              <span className="text-xs mt-1">Menu</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
} 