"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Save, User } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    newPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        storeName: session.user.name || "",
        email: session.user.email || "",
        newPassword: "",
      });
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const updateData: any = {};
      
      if (formData.storeName !== session?.user?.name) {
        updateData.storeName = formData.storeName;
      }
      
      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
      }
      
      // Only make the API call if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        return;
      }
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }
      
      toast.success("Profile updated successfully");
      
      // Clear password field
      setFormData({
        ...formData,
        newPassword: "",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <ProtectedRoute>
      <div className="pb-20">
        <header className="bg-white dark:bg-slate-800 p-4 shadow">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </header>

        <main className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User size={20} className="mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    placeholder="Your Store Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save size={16} className="mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </main>

        <Navbar />
      </div>
    </ProtectedRoute>
  );
} 