import { Suspense } from "react";
import { TrackedProperties } from "../components/TrackedProperties";
import { AddPropertyForm } from "../components/AddPropertyForm";

export default function DashboardPage() {
  return (
    <main className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-card rounded-lg p-4 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Add Property</h2>
            <Suspense fallback={<div>Loading form...</div>}>
              <AddPropertyForm />
            </Suspense>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <div className="bg-card rounded-lg p-4 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Your Tracked Properties</h2>
            <Suspense fallback={<div>Loading properties...</div>}>
              <TrackedProperties />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
} 