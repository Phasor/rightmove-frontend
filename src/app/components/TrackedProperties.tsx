"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

type Property = {
  id: string;
  url: string;
  current_status: string;
  last_checked_at: string;
  subscription_id: string;
};

export function TrackedProperties() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getUser();
  }, []);

  useEffect(() => {
    async function loadProperties() {
      if (!user) return;
      
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          property_id,
          properties (
            id,
            url,
            current_status,
            last_checked_at
          )
        `)
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error loading properties:", error);
        setProperties([]);
      } else if (data) {
        // Transform the data to a flatter structure
        const transformedData: Property[] = data.map((item: any) => ({
          id: item.properties.id,
          url: item.properties.url,
          current_status: item.properties.current_status || "Unknown",
          last_checked_at: item.properties.last_checked_at || "",
          subscription_id: item.id
        }));
        
        setProperties(transformedData);
      }
      
      setLoading(false);
    }
    
    loadProperties();
  }, [user]);

  const handleUnsubscribe = async (subscriptionId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);
      
      if (error) throw error;
      
      // Remove the property from the state
      setProperties(properties.filter(p => p.subscription_id !== subscriptionId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  };

  if (loading) return <div className="py-4 text-center">Loading your properties...</div>;
  
  if (properties.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You're not tracking any listings yet!</p>
        <p className="text-sm mt-2">Add a Rightmove property URL to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map((property) => (
        <div 
          key={property.id} 
          className="p-4 border rounded-md bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
        >
          <div className="flex-1">
            <a 
              href={property.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {property.url}
            </a>
            <div className="mt-1 text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className="px-2 py-1 bg-muted rounded-full text-xs">
                {property.current_status || "Unknown"}
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full sm:w-auto">
            {deleteConfirm === property.subscription_id ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUnsubscribe(property.subscription_id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(property.subscription_id)}
                className="px-3 py-1 border border-red-300 text-red-500 rounded-md text-sm hover:bg-red-50"
              >
                Unsubscribe
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 