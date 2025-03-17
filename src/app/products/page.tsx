"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BarcodeScanner from '@/components/BarcodeScanner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Barcode, Plus, Search } from "lucide-react";
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    barcode: "",
    item_name: "",
    price: "",
    weight: "",
    category: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        
        // Check if the response has an 'items' property (new format)
        const items = data.items || data;
        
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  const handleBarcodeDetected = (barcode: string) => {
    setShowScanner(false);
    setFormData({ ...formData, barcode });
    toast.success("Barcode detected", {
      description: `Barcode: ${barcode}`,
    });
  };

  const handleScanBarcode = () => {
    // Check if the device has camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // If no camera access, show a prompt for manual entry
      const barcode = prompt("Enter barcode manually:");
      if (barcode) {
        handleBarcodeDetected(barcode);
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
      
      const productData = {
        barcode: formData.barcode,
        item_name: formData.item_name,
        price: parseFloat(formData.price) || 0,
        weight: formData.weight,
        category: formData.category,
        image_url: imageUrl,
      };
      
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add product");
      }
      
      toast.success("Product added successfully");
      
      // Reset form
      setFormData({
        barcode: "",
        item_name: "",
        price: "",
        weight: "",
        category: "",
        image_url: "",
      });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      
      // Refresh products list
      router.refresh();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.includes(searchQuery)
  );

  return (
    <ProtectedRoute>
      <div className="pb-20">
        <header className="bg-white dark:bg-slate-800 p-4 shadow flex justify-between items-center">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-2" />
            {showForm ? "Cancel" : "Add Product"}
          </Button>
        </header>

        <main className="p-4">
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        placeholder="e.g. 500g, 1L"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="e.g. Dairy, Produce"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    
                    {imagePreview && (
                      <div className="mt-2">
                        <Image
                          src={imagePreview}
                          alt="Product preview"
                          width={100}
                          height={100}
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Adding..." : "Add Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search products by name or barcode"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {loading && !showForm ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {product.image_url && (
                      <div className="h-40 relative">
                        <Image
                          src={product.image_url}
                          alt={product.item_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{product.item_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Barcode: {product.barcode}</p>
                      {product.price > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Price: ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                        </p>
                      )}
                      {product.weight && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Weight/Size: {product.weight}
                        </p>
                      )}
                      {product.category && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Category: {product.category}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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