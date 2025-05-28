"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function AddPropertyForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getUser();
  }, []);

  const validateUrl = (url: string) => {
    // Basic validation for Rightmove URL format
    return url.includes("rightmove.co.uk/properties/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be signed in to add properties");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate URL
      if (!validateUrl(url)) {
        throw new Error("Please enter a valid Rightmove property URL");
      }

      // First, try to find the property by URL
      let { data: property, error: findError } = await supabase
        .from("properties")
        .select("id")
        .eq("url", url)
        .single();

      if (findError && findError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" error, which is expected if property doesn't exist
        throw findError;
      }

      let propertyId;

      // If property doesn't exist, insert it
      if (!property) {
        const { data: newProperty, error: insertError } = await supabase
          .from("properties")
          .insert([{ url }])
          .select("id")
          .single();

        if (insertError) throw insertError;
        if (!newProperty) throw new Error("Failed to create property");
        
        propertyId = newProperty.id;
      } else {
        propertyId = property.id;
      }

      // Check if the user already has a subscription for this property
      const { data: existingSub, error: subCheckError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .single();

      if (!subCheckError && existingSub) {
        throw new Error("You are already tracking this property");
      }

      // Add subscription
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert([
          {
            user_id: user.id,
            property_id: propertyId,
          },
        ]);

      if (subError) throw subError;

      setSuccess(true);
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Failed to add property");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="propertyUrl" className="block text-sm font-medium mb-1">
          Rightmove Property URL
        </label>
        <input
          id="propertyUrl"
          type="url"
          placeholder="https://www.rightmove.co.uk/properties/123456789"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Example: https://www.rightmove.co.uk/properties/156861416
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Adding..." : "Track Property"}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          Property added successfully! Refresh to see your tracked properties.
        </div>
      )}
    </form>
  );
} 