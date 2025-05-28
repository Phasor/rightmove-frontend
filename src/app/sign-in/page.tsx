"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Optionally, check if user is already signed in and redirect
  // (This can be improved with a useEffect and Supabase session check)

  return (
    <div className="max-w-md mx-auto mt-24 p-8 border rounded-lg shadow-lg bg-card">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign in to your account</h1>
      <button 
        className="w-full mb-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90" 
        onClick={handleGoogleSignIn} 
        disabled={loading}
      >
        Sign in with Google
      </button>
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <input
          type="email"
          className="w-full p-2 border rounded"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button 
          type="submit" 
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90" 
          disabled={loading}
        >
          Send magic link
        </button>
      </form>
      {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
    </div>
  );
} 