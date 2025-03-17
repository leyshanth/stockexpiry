'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

interface DbStatus {
  success: boolean;
  connection: string;
  timestamp: string;
  tables: string[];
  productsTableExists: boolean;
  usersTableExists: boolean;
  expiryItemsTableExists: boolean;
}

export default function SetupDbPage() {
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
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
  
  const performAction = async (endpoint: string, actionName: string) => {
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
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                {dbStatus?.connection ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Database Connection</p>
                <p className="text-sm text-gray-500">
                  {dbStatus?.connection || "Not connected"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                {dbStatus?.productsTableExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Products Table</p>
                <p className="text-sm text-gray-500">
                  {dbStatus?.productsTableExists ? "Exists" : "Not found"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                {dbStatus?.usersTableExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Users Table</p>
                <p className="text-sm text-gray-500">
                  {dbStatus?.usersTableExists ? "Exists" : "Not found"}
                </p>
              </div>
            </div>
            
            {actionInProgress && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-md flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>{actionMessage}</p>
              </div>
            )}
            
            {!actionInProgress && (
              <>
                <div className="space-y-2">
                  <h3 className="font-medium">Step 1: Create Products Table</h3>
                  <Button 
                    onClick={() => performAction('create-products-table', 'Create Products Table')}
                    variant={dbStatus?.productsTableExists ? "outline" : "default"}
                    className="w-full"
                    disabled={actionInProgress}
                  >
                    {dbStatus?.productsTableExists ? 'Products Table Exists' : 'Create Products Table'}
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