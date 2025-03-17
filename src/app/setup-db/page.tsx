'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

export default function SetupDbPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  
  useEffect(() => {
    checkDatabaseStatus();
  }, []);
  
  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-tables');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus(data);
      } else {
        console.error('Failed to check database status:', data.error);
        toast.error(data.error || 'Failed to check database status');
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      toast.error('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  const performAction = async (endpoint, actionName) => {
    setActionInProgress(true);
    setActionMessage(`${actionName} in progress...`);
    
    try {
      const response = await fetch(`/api/${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || `${actionName} completed successfully`);
        
        // Refresh database status
        await checkDatabaseStatus();
      } else {
        console.error(`Failed to ${actionName.toLowerCase()}:`, data.error);
        toast.error(data.error || `Failed to ${actionName.toLowerCase()}`);
      }
    } catch (error) {
      console.error(`Error during ${actionName.toLowerCase()}:`, error);
      toast.error('Failed to connect to the server');
    } finally {
      setActionInProgress(false);
      setActionMessage('');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Database Setup Guide</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Current status of your database tables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Database Connection</span>
              {dbStatus ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-5 w-5 mr-1" /> Connected
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-5 w-5 mr-1" /> Not Connected
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Products Table</span>
              {dbStatus?.productsTableExists ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-5 w-5 mr-1" /> Exists
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-5 w-5 mr-1" /> Missing
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Users Table</span>
              {dbStatus?.usersTableExists ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-5 w-5 mr-1" /> Exists
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-5 w-5 mr-1" /> Missing
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Expiry Items Table</span>
              {dbStatus?.expiryItemsTableExists ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-5 w-5 mr-1" /> Exists
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-5 w-5 mr-1" /> Missing
                </span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={checkDatabaseStatus} variant="outline" className="w-full">
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Setup Actions</CardTitle>
          <CardDescription>Follow these steps to set up your database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionInProgress ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{actionMessage}</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-medium">Step 1: Create Products Table</h3>
                  <Button 
                    onClick={() => performAction('create-products-table', 'Create Products Table')}
                    variant={dbStatus?.productsTableExists ? "outline" : "default"}
                    className="w-full"
                    disabled={actionInProgress}
                  >
                    {dbStatus?.productsTableExists ? 'Recreate Products Table' : 'Create Products Table'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Step 2: Create Users Table</h3>
                  <Button 
                    onClick={() => performAction('create-users-table', 'Create Users Table')}
                    variant={dbStatus?.usersTableExists ? "outline" : "default"}
                    className="w-full"
                    disabled={actionInProgress}
                  >
                    {dbStatus?.usersTableExists ? 'Users Table Exists' : 'Create Users Table'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Step 3: Create Default User</h3>
                  <Button 
                    onClick={() => performAction('create-user-1', 'Create Default User')}
                    variant="default"
                    className="w-full"
                    disabled={actionInProgress || !dbStatus?.usersTableExists}
                  >
                    Create Default User
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkDatabaseStatus} disabled={actionInProgress}>
            Refresh Status
          </Button>
          <Button variant="default" onClick={() => window.location.href = '/products'} disabled={actionInProgress}>
            Go to Products <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 