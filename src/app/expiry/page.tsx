"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BarcodeScanner from '@/components/BarcodeScanner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Barcode, Calendar, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  barcode: string;
  item_name: string;
  price: number;
  weight: string;
  category: string;
  image_url: string;
}

export default function ExpiryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    barcode: "",
    item_name: "",
    price: "",
    weight: "",
    category: "",
    image_url: "",
    quantity: "1",
    expiry_date: format(new Date(), "yyyy-MM-dd"),
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productFound, setProductFound] = useState(false);
  const [expiryItems, setExpiryItems] = useState([]);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Only allow quantity and expiry date to be edited
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow editing quantity and expiry_date
    if (name === 'quantity' || name === 'expiry_date') {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    setFormData({ ...formData, barcode });
    
    try {
      // Check if the product exists in the database
      const response = await fetch(`/api/products/barcode/${barcode}`);
      
      if (response.ok) {
        const product = await response.json();
        
        // Pre-fill form with product data
        setFormData({
          ...formData,
          barcode: product.barcode,
          item_name: product.item_name,
          price: product.price.toString(),
          weight: product.weight,
          category: product.category,
          image_url: product.image_url,
          quantity: "1",
          expiry_date: format(new Date(), "yyyy-MM-dd"),
        });
        
        setProductFound(true);
        setImagePreview(product.image_url);
        
        toast.success("Product found", {
          description: `${product.item_name} loaded from database`,
        });
      } else {
        // Product not found, redirect to products page
        toast.error("Product not found", {
          description: "Please add the product first",
        });
        
        // Store the barcode in localStorage to pre-fill it on the products page
        localStorage.setItem('pendingBarcode', barcode);
        
        // Redirect to products page
        router.push('/products');
      }
    } catch (error) {
      console.error("Error checking product:", error);
      toast.error("Error checking product");
    }
  };

  const handleScanBarcode = () => {
    setShowScanner(true);
  };

  // Use useCallback to prevent the function from being recreated on every render
  const fetchExpiryItems = useCallback(async () => {
    try {
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
  }, []);

  useEffect(() => {
    fetchExpiryItems();
    // Only run this effect when fetchTrigger changes
  }, [fetchTrigger, fetchExpiryItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productFound) {
      toast.error("Please scan a valid product barcode first");
      return;
    }
    
    try {
      setLoading(true);
      
      const expiryData = {
        barcode: formData.barcode,
        item_name: formData.item_name,
        price: parseFloat(formData.price) || 0,
        weight: formData.weight,
        category: formData.category,
        image_url: formData.image_url,
        quantity: parseInt(formData.quantity) || 1,
        expiry_date: formData.expiry_date,
      };
      
      const response = await fetch("/api/expiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expiryData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add expiry item");
      }
      
      toast.success("Expiry item added successfully");
      
      // Navigate to home page
      router.push("/home");
    } catch (error) {
      console.error("Error adding expiry item:", error);
      toast.error("Failed to add expiry item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="pb-20">
        <header className="bg-white dark:bg-slate-800 p-4 shadow">
          <h1 className="text-2xl font-bold">Add Expiry Item</h1>
        </header>

        <main className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Product Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="barcode"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      placeholder="Scan or enter barcode"
                      readOnly
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleScanBarcode} variant="outline">
                      <Barcode className="h-4 w-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                </div>

                {productFound && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="item_name">Product Name</Label>
                      <Input
                        id="item_name"
                        name="item_name"
                        value={formData.item_name}
                        readOnly
                        className="bg-gray-100 dark:bg-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          name="price"
                          value={formData.price}
                          readOnly
                          className="bg-gray-100 dark:bg-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight/Size</Label>
                        <Input
                          id="weight"
                          name="weight"
                          value={formData.weight}
                          readOnly
                          className="bg-gray-100 dark:bg-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        name="category"
                        value={formData.category}
                        readOnly
                        className="bg-gray-100 dark:bg-slate-700"
                      />
                    </div>

                    {imagePreview && (
                      <div className="space-y-2">
                        <Label>Product Image</Label>
                        <div className="border rounded-md p-2 w-full h-40 flex items-center justify-center">
                          {/* Check if it's a base64 image */}
                          {imagePreview.startsWith('data:') ? (
                            // For base64 images, use a regular img tag
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="max-h-full object-contain"
                            />
                          ) : (
                            // For regular URLs, use Next.js Image component
                            <Image
                              src={imagePreview}
                              alt="Product preview"
                              width={150}
                              height={150}
                              className="max-h-full object-contain"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiry_date">Expiry Date</Label>
                        <div className="flex">
                          <Input
                            id="expiry_date"
                            name="expiry_date"
                            type="date"
                            value={formData.expiry_date}
                            onChange={handleInputChange}
                            required
                          />
                          <Button type="button" variant="outline" className="ml-2" onClick={() => {
                            setFormData({
                              ...formData,
                              expiry_date: format(new Date(), "yyyy-MM-dd")
                            });
                          }}>
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expiry Item
                    </Button>
                  </>
                )}

                {!productFound && formData.barcode && (
                  <div className="text-center py-6">
                    <p className="text-red-500 mb-4">Product not found. Please add it first.</p>
                    <Button type="button" onClick={() => router.push('/products')}>
                      Go to Products Page
                    </Button>
                  </div>
                )}

                {!productFound && !formData.barcode && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Please scan a product barcode to continue
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </main>

        {showScanner && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        )}

        <Navbar />
      </div>
    </ProtectedRoute>
  );
} 