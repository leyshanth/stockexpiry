"use client";

import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    setFormData({ ...formData, barcode });
    
    console.log("Barcode detected:", barcode);
    
    try {
      // Try to fetch product details from the database
      console.log("Fetching product details for barcode:", barcode);
      const response = await fetch(`/api/products/barcode/${barcode}`);
      
      console.log("API response status:", response.status);
      
      if (response.ok) {
        const productData = await response.json();
        console.log("Product data received:", productData);
        
        // Pre-fill the form with product details
        setFormData({
          barcode: productData.barcode,
          item_name: productData.item_name,
          price: productData.price.toString(),
          weight: productData.weight || "",
          category: productData.category || "",
          image_url: productData.image_url || "",
          quantity: "1", // Default quantity
          expiry_date: format(new Date(), "yyyy-MM-dd"), // Set today's date as default
        });
        
        // Set image preview if available
        if (productData.image_url) {
          setImagePreview(productData.image_url);
        }
        
        setProductFound(true);
        
        toast.success("Product found", {
          description: `Found: ${productData.item_name}`,
        });
      } else {
        // If product not found, just set the barcode
        console.log("Product not found for barcode:", barcode);
        setProductFound(false);
        toast.info("Barcode detected", {
          description: `Barcode: ${barcode}. No product details found.`,
        });
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast.error("Error fetching product details");
    }
  };

  const handleScanBarcode = () => {
    // Check if the device has camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // If no camera access, show a prompt for manual entry
      const barcode = prompt("Enter barcode manually:");
      if (barcode && barcode.trim() !== "") {
        console.log("Manual barcode entered:", barcode);
        handleBarcodeDetected(barcode.trim());
      } else {
        console.log("No barcode entered or empty barcode");
      }
      return;
    }
    
    // Otherwise show the scanner
    setShowScanner(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Handle image upload if there's a new image
      let imageUrl = formData.image_url;
      if (imageFile) {
        // In a real app, you would upload the image to a server or cloud storage
        // For this example, we'll just use a placeholder URL
        imageUrl = `/images/${Date.now()}_${imageFile.name}`;
      }
      
      const expiryData = {
        barcode: formData.barcode,
        item_name: formData.item_name,
        price: parseFloat(formData.price) || 0,
        weight: formData.weight,
        category: formData.category,
        image_url: imageUrl,
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
        throw new Error("Failed to save expiry item");
      }
      
      toast.success("Expiry item added successfully");
      
      // If product wasn't in database before, ask if user wants to save it
      if (!productFound && formData.barcode) {
        const saveProduct = window.confirm("Would you like to save this as a product for future use?");
        
        if (saveProduct) {
          const productData = {
            barcode: formData.barcode,
            item_name: formData.item_name,
            price: parseFloat(formData.price) || 0,
            weight: formData.weight,
            category: formData.category,
            image_url: imageUrl,
          };
          
          const productResponse = await fetch("/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productData),
          });
          
          if (productResponse.ok) {
            toast.success("Product saved for future use");
          }
        }
      }
      
      // Reset form
      setFormData({
        barcode: "",
        item_name: "",
        price: "",
        weight: "",
        category: "",
        image_url: "",
        quantity: "1",
        expiry_date: format(new Date(), "yyyy-MM-dd"),
      });
      setImageFile(null);
      setImagePreview(null);
      setProductFound(false);
      
      // Navigate to home page
      router.push("/home");
    } catch (error) {
      console.error("Error saving expiry item:", error);
      toast.error("Failed to save expiry item");
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
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      placeholder="Enter barcode"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-6"
                    onClick={handleScanBarcode}
                  >
                    <Barcode size={18} className="mr-2" />
                    Scan
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input
                    id="item_name"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight/Size</Label>
                    <Input
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g., 500g, 1L"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Dairy, Produce"
                  />
                </div>
                
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
                    <Input
                      id="expiry_date"
                      name="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image">Image (Optional)</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {(imagePreview || formData.image_url) && (
                    <div className="mt-2 relative h-32 w-32">
                      <Image
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Add Expiry Item"}
                </Button>
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