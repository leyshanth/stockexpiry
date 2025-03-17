"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeletedItem {
  id: number;
  barcode: string;
  item_name: string;
  price: number;
  quantity: number;
  expiry_date: string;
  deleted_at: string;
  type: "product" | "expiry";
}

export default function DeletedPage() {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Use useCallback to prevent the function from being recreated on every render
  const fetchDeletedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/deleted");
      if (!response.ok) {
        throw new Error("Failed to fetch deleted items");
      }
      const data = await response.json();
      
      // Check if the response has an 'items' property (new format)
      const items = data.items || data;
      
      setDeletedItems(items);
    } catch (error) {
      console.error("Error fetching deleted items:", error);
      toast.error("Failed to load deleted items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedItems();
    // Only run this effect when fetchTrigger changes
  }, [fetchTrigger, fetchDeletedItems]);

  const handleRestoreItem = async (id: number, type: string) => {
    try {
      const response = await fetch(`/api/deleted/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to restore item");
      }
      
      // Trigger a re-fetch instead of modifying state directly
      setFetchTrigger(prev => prev + 1);
      toast.success("Item restored successfully");
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error("Failed to restore item");
    }
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/deleted/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      
      // Trigger a re-fetch instead of modifying state directly
      setFetchTrigger(prev => prev + 1);
      toast.success("Item permanently deleted");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <ProtectedRoute>
      <div className="pb-20">
        <header className="bg-white dark:bg-slate-800 p-4 shadow">
          <h1 className="text-2xl font-bold">Deleted Items</h1>
        </header>

        <main className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : deletedItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No deleted items found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{item.item_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Barcode: {item.barcode}</p>
                        {item.expiry_date && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Expires: {format(parseISO(item.expiry_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Deleted: {format(parseISO(item.deleted_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Type: {item.type === "product" ? "Product" : "Expiry Item"}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleRestoreItem(item.id, item.type)}
                          title="Restore"
                        >
                          <RefreshCw size={18} className="text-green-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handlePermanentDelete(item.id)}
                          title="Delete Permanently"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Navbar />
      </div>
    </ProtectedRoute>
  );
} 