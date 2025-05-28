"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (pathname === "/sign-in") {
        router.replace("/dashboard");
      }
    } else {
      if (pathname === "/dashboard") {
        router.replace("/sign-in");
      }
    }
  }, [user, pathname, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b flex justify-between items-center px-4 py-2">
      <div className="font-bold text-lg">Rightmove Tracker</div>
      {user ? (
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Sign out
        </button>
      ) : null}
    </header>
  );
} 