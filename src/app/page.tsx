import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Track Rightmove listings effortlessly
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Get notified when property status changes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Sign in or create account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How it works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <div className="text-primary text-xl font-bold mb-2">1. Track</div>
              <h3 className="text-lg font-medium mb-3">Add any Rightmove property</h3>
              <p className="text-muted-foreground">
                Paste the URL of any Rightmove property you're interested in
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <div className="text-primary text-xl font-bold mb-2">2. Monitor</div>
              <h3 className="text-lg font-medium mb-3">We check daily</h3>
              <p className="text-muted-foreground">
                Our system automatically checks for status changes every day
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <div className="text-primary text-xl font-bold mb-2">3. Get Notified</div>
              <h3 className="text-lg font-medium mb-3">Email alerts</h3>
              <p className="text-muted-foreground">
                Receive timely notifications when a property status changes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Rightmove Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
