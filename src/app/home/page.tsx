"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Filter, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";

interface ExpiryItem {
  id: number;
  barcode: string;
  item_name: string;
  price: number;
  weight: string;
  category: string;
  image_url: string;
  quantity: number;
  expiry_date: string;
}

export default function HomePage() {
  const router = useRouter();
  const [expiryItems, setExpiryItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    expiringSoon: false,
    expired: false,
    all: true,
  });

  useEffect(() => {
    fetchExpiryItems();
  }, []);

  const fetchExpiryItems = async () => {
    try {
      const response = await fetch("/api/expiry");
      if (!response.ok) {
        throw new Error("Failed to fetch expiry items");
      }
      const data = await response.json();
      setExpiryItems(data);
    } catch (error) {
      console.error("Error fetching expiry items:", error);
      toast.error("Failed to fetch expiry items");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/expiry/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      
      setExpiryItems(expiryItems.filter(item => item.id !== id));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", label: "Expired", color: "bg-red-500" };
    } else if (daysUntilExpiry <= 7) {
      return { status: "expiring-soon", label: "Expiring Soon", color: "bg-yellow-500" };
    } else {
      return { status: "good", label: "Good", color: "bg-green-500" };
    }
  };

  const handleFilterChange = (filter: keyof typeof filterOptions) => {
    if (filter === 'all') {
      setFilterOptions({
        expiringSoon: false,
        expired: false,
        all: true,
      });
    } else {
      setFilterOptions({
        ...filterOptions,
        [filter]: !filterOptions[filter],
        all: false,
      });
      
      // If no filters are selected, default to "all"
      if (
        filter === 'expiringSoon' && !filterOptions.expiringSoon && !filterOptions.expired ||
        filter === 'expired' && !filterOptions.expired && !filterOptions.expiringSoon
      ) {
        setFilterOptions({
          expiringSoon: false,
          expired: false,
          all: true,
        });
      }
    }
  };

  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterOptions({
      expiringSoon: false,
      expired: false,
      all: true,
    });
  };

  // Filter items based on filter options
  const filteredItems = expiryItems.filter(item => {
    // Status filter
    if (!filterOptions.all) {
      const { status } = getExpiryStatus(item.expiry_date);
      
      if (filterOptions.expiringSoon && status !== "expiring-soon") {
        return false;
      }
      
      if (filterOptions.expired && status !== "expired") {
        return false;
      }
      
      if (!filterOptions.expiringSoon && !filterOptions.expired) {
        return false;
      }
    }
    
    // Date range filter
    if (startDate || endDate) {
      const itemDate = new Date(item.expiry_date);
      
      if (startDate) {
        const start = new Date(startDate);
        if (itemDate < start) {
          return false;
        }
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day
        if (itemDate > end) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Check if any filters are active
  const hasActiveFilters = startDate || endDate || !filterOptions.all;

  return (
    <ProtectedRoute>
      <div className="pb-20">
        <header className="bg-white dark:bg-slate-800 p-4 shadow">
          <h1 className="text-2xl font-bold">Stock & Expiry Tracker</h1>
        </header>

        <main className="p-4 space-y-4">
          <div className="relative">
            <div className="flex items-center mb-4 justify-between">
              <h2 className="text-lg font-semibold">Expiry Items</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={18} />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                  )}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => router.push("/expiry")}
                >
                  <Plus size={16} className="mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Status</Label>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant={filterOptions.all ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleFilterChange('all')}
                        >
                          All
                        </Badge>
                        <Badge 
                          variant={filterOptions.expiringSoon ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleFilterChange('expiringSoon')}
                        >
                          Expiring Soon
                        </Badge>
                        <Badge 
                          variant={filterOptions.expired ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleFilterChange('expired')}
                        >
                          Expired
                        </Badge>
                      </div>
                    </div>
                    
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                      onClear={clearDateRange}
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No items found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push("/expiry")}
              >
                <Plus size={16} className="mr-2" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const { status, label, color } = getExpiryStatus(item.expiry_date);
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{item.item_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Barcode: {item.barcode}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Quantity: {item.quantity}</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-block w-3 h-3 rounded-full ${color} mr-2`}></span>
                            <p className="text-sm">
                              Expires: {format(parseISO(item.expiry_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        <Navbar />
      </div>
    </ProtectedRoute>
  );
} 