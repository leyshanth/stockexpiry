"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';

// Define the Product type
interface Product {
  id: number;
  name: string;
  price: string | number;
  weight?: string;
  category?: string;
  barcode?: string;
  image_url?: string;
}

// Define the form data type
interface ProductFormData {
  barcode: string;
  name: string;
  price: string;
  weight: string;
  category: string;
  image_url: string;
}

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    barcode: '',
    name: '',
    price: '',
    weight: '',
    category: '',
    image_url: ''
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status, router]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use the simple product API instead
      const response = await fetch('/api/simple-product');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.items || []);
      } else {
        console.error('Failed to fetch products:', data.error);
        toast.error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleBarcodeDetected = (barcode: string) => {
    setFormData({
      ...formData,
      barcode: barcode
    });
    setIsScannerOpen(false);
    toast.success(`Barcode ${barcode} detected`);
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Use the simple product API instead
      const response = await fetch('/api/simple-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Product added successfully');
        
        // Reset form
        setFormData({
          barcode: '',
          name: '',
          price: '',
          weight: '',
          category: '',
          image_url: ''
        });
        
        // Refresh products list
        fetchProducts();
      } else {
        console.error('Failed to add product:', data.error);
        toast.error(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to connect to the server');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Products Management</h1>
      
      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">Add Product</TabsTrigger>
          <TabsTrigger value="view">View Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>Enter the details of the new product</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <div className="flex">
                      <Input
                        id="barcode"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => setIsScannerOpen(!isScannerOpen)}
                      >
                        Scan
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight/Size</Label>
                    <Input
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                  />
                </div>
                
                {isScannerOpen && (
                  <div className="mt-4">
                    <BarcodeScanner 
                      onDetected={handleBarcodeDetected} 
                      onClose={() => setIsScannerOpen(false)} 
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Product'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="view" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      {product.image_url && (
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://placehold.co/400x300?text=No+Image';
                            }}
                          />
                        </div>
                      )}
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>
                          {product.category && <span className="block">Category: {product.category}</span>}
                          {product.barcode && <span className="block">Barcode: {product.barcode}</span>}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        {product.price ? (
                          <span className="font-bold">${parseFloat(product.price.toString()).toFixed(2)}</span>
                        ) : (
                          <span>No price</span>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products found. Add some products to get started.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchProducts} variant="outline" className="w-full">
                Refresh Products
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 