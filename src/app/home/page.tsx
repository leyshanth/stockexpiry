"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, isBefore, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, differenceInMilliseconds } from "date-fns";
import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Filter, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface ExpiryItem {
  id: number;
  barcode: string;
  item_name: string;
  price: number | string;
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
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const { status } = useSession();

  // Use useCallback to prevent the function from being recreated on every render
  const fetchExpiryItems = useCallback(async () => {
    // Don't fetch if we're not authenticated yet
    if (status !== "authenticated") return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/expiry");
      
      if (!response.ok) {
        throw new Error("Failed to fetch expiry items");
      }
      
      const data = await response.json();
      
      // Check if the response has an 'items' property (new format)
      const items = data.items || data;
      
      setExpiryItems(items);
    } catch (error) {
      console.error("Error fetching expiry items:", error);
      toast.error("Failed to load expiry items");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchExpiryItems();
    // Only run this effect when fetchTrigger changes
  }, [fetchTrigger, fetchExpiryItems]);

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
      
      // Update the UI by triggering a re-fetch instead of modifying state directly
      setFetchTrigger(prev => prev + 1);
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
                const expiryDate = parseISO(item.expiry_date);
                const isExpired = isBefore(expiryDate, new Date());
                const expiresInDays = differenceInDays(expiryDate, new Date());
                const expiresInWeeks = Math.floor(expiresInDays / 7);
                const expiresInMonths = Math.floor(expiresInDays / 30);
                const expiresInYears = Math.floor(expiresInDays / 365);
                
                // Check if item expires today
                const expiresInHours = differenceInHours(expiryDate, new Date());
                const expiresInMinutes = differenceInMinutes(expiryDate, new Date());
                const expiresInSeconds = differenceInSeconds(expiryDate, new Date());
                const expiresInMilliseconds = differenceInMilliseconds(expiryDate, new Date());
                const expiresInTime = expiresInHours >= 0 && expiresInHours < 24;
                const expiresInDay = expiresInDays === 0;
                const expiresInTomorrow = expiresInDays === 1;
                const expiresInYesterday = expiresInDays === -1;
                const expiresInTwoWeeks = expiresInDays <= 14 && expiresInDays > 0;
                const expiresInThreeWeeks = expiresInDays <= 21 && expiresInDays > 14;
                const expiresInFourWeeks = expiresInDays <= 28 && expiresInDays > 21;
                const expiresInFiveWeeks = expiresInDays <= 35 && expiresInDays > 28;
                const expiresInSixWeeks = expiresInDays <= 42 && expiresInDays > 35;
                const expiresInSevenWeeks = expiresInDays <= 49 && expiresInDays > 42;
                const expiresInEightWeeks = expiresInDays <= 56 && expiresInDays > 49;
                const expiresInNineWeeks = expiresInDays <= 63 && expiresInDays > 56;
                const expiresInTenWeeks = expiresInDays <= 70 && expiresInDays > 63;
                const expiresInElevenWeeks = expiresInDays <= 77 && expiresInDays > 70;
                const expiresInTwelveWeeks = expiresInDays <= 84 && expiresInDays > 77;
                const expiresInThirteenWeeks = expiresInDays <= 91 && expiresInDays > 84;
                const expiresInFourteenWeeks = expiresInDays <= 98 && expiresInDays > 91;
                const expiresInFifteenWeeks = expiresInDays <= 105 && expiresInDays > 98;
                const expiresInSixteenWeeks = expiresInDays <= 112 && expiresInDays > 105;
                const expiresInSeventeenWeeks = expiresInDays <= 119 && expiresInDays > 112;
                const expiresInEighteenWeeks = expiresInDays <= 126 && expiresInDays > 119;
                const expiresInNineteenWeeks = expiresInDays <= 133 && expiresInDays > 126;
                const expiresInTwentyWeeks = expiresInDays <= 140 && expiresInDays > 133;
                const expiresInTwentyOneWeeks = expiresInDays <= 147 && expiresInDays > 140;
                const expiresInTwentyTwoWeeks = expiresInDays <= 154 && expiresInDays > 147;
                const expiresInTwentyThreeWeeks = expiresInDays <= 161 && expiresInDays > 154;
                const expiresInTwentyFourWeeks = expiresInDays <= 168 && expiresInDays > 161;
                const expiresInTwentyFiveWeeks = expiresInDays <= 175 && expiresInDays > 168;
                const expiresInTwentySixWeeks = expiresInDays <= 182 && expiresInDays > 175;
                const expiresInTwentySevenWeeks = expiresInDays <= 189 && expiresInDays > 182;
                const expiresInTwentyEightWeeks = expiresInDays <= 196 && expiresInDays > 189;
                const expiresInTwentyNineWeeks = expiresInDays <= 203 && expiresInDays > 196;
                const expiresInThirtyWeeks = expiresInDays <= 210 && expiresInDays > 203;
                const expiresInThirtyOneWeeks = expiresInDays <= 217 && expiresInDays > 210;
                const expiresInThirtyTwoWeeks = expiresInDays <= 224 && expiresInDays > 217;
                const expiresInThirtyThreeWeeks = expiresInDays <= 231 && expiresInDays > 224;
                const expiresInThirtyFourWeeks = expiresInDays <= 238 && expiresInDays > 231;
                const expiresInThirtyFiveWeeks = expiresInDays <= 245 && expiresInDays > 238;
                const expiresInThirtySixWeeks = expiresInDays <= 252 && expiresInDays > 245;
                const expiresInThirtySevenWeeks = expiresInDays <= 259 && expiresInDays > 252;
                const expiresInThirtyEightWeeks = expiresInDays <= 266 && expiresInDays > 259;
                const expiresInThirtyNineWeeks = expiresInDays <= 273 && expiresInDays > 266;
                const expiresInFortyWeeks = expiresInDays <= 280 && expiresInDays > 273;
                const expiresInFortyOneWeeks = expiresInDays <= 287 && expiresInDays > 280;
                const expiresInFortyTwoWeeks = expiresInDays <= 294 && expiresInDays > 287;
                const expiresInFortyThreeWeeks = expiresInDays <= 301 && expiresInDays > 294;
                const expiresInFortyFourWeeks = expiresInDays <= 308 && expiresInDays > 301;
                const expiresInFortyFiveWeeks = expiresInDays <= 315 && expiresInDays > 308;
                const expiresInFortySixWeeks = expiresInDays <= 322 && expiresInDays > 315;
                const expiresInFortySevenWeeks = expiresInDays <= 329 && expiresInDays > 322;
                const expiresInFortyEightWeeks = expiresInDays <= 336 && expiresInDays > 329;
                const expiresInFortyNineWeeks = expiresInDays <= 343 && expiresInDays > 336;
                const expiresInFiftyWeeks = expiresInDays <= 350 && expiresInDays > 343;
                const expiresInFiftyOneWeeks = expiresInDays <= 357 && expiresInDays > 350;
                const expiresInFiftyTwoWeeks = expiresInDays <= 364 && expiresInDays > 357;
                
                return (
                  <Card key={item.id} className={`overflow-hidden ${isExpired ? 'border-red-500' : expiresInDay ? 'border-orange-500' : expiresInTwoWeeks ? 'border-yellow-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.item_name}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {isExpired && (
                              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                Expired
                              </Badge>
                            )}
                            {expiresInDay && !isExpired && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                Expires Today
                              </Badge>
                            )}
                            {expiresInTomorrow && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Expires Tomorrow
                              </Badge>
                            )}
                            {expiresInTwoWeeks && !expiresInDay && !expiresInTomorrow && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                Expires Soon
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                              {item.category || "Uncategorized"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Expires: {format(expiryDate, "PPP")}
                          </p>
                          <p className="text-sm mt-1">
                            Quantity: {item.quantity} {item.weight && `• ${item.weight}`}
                          </p>
                          {item.price && (
                            <p className="text-sm mt-1">
                              Price: £{typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        {item.image_url && (
                          <div className="ml-4 w-20 h-20 flex-shrink-0">
                            {/* Check if it's a base64 image */}
                            {item.image_url.startsWith('data:') ? (
                              // For base64 images, use a regular img tag
                              <img
                                src={item.image_url}
                                alt={item.item_name}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              // For regular URLs, use Next.js Image component
                              <Image
                                src={item.image_url}
                                alt={item.item_name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover rounded-md"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
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