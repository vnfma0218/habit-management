"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const menus = [
    { href: "/home", label: "Home" },
    { href: "/new", label: "New" },
    { href: "/myhabit", label: "My Routines" },
  ];

  const onSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="flex gap-2 sm:gap-4 items-center w-full">
      <Link href="/home">
        <div className="text-slate-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M7.5 7v10M16.5 7v10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M7.5 12h9"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>

      <ul className="flex gap-2 sm:gap-4">
        {menus.map((menu) => {
          const isActive =
            pathname === menu.href || pathname.startsWith(`${menu.href}/`);

          return (
            <li key={menu.href}>
              <Link
                href={menu.href}
                className={cn(
                  "underline-offset-4",
                  isActive ? "underline decoration-2" : "no-underline"
                )}
              >
                {menu.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        className={cn(
          "ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-border",
          "text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        )}
        aria-label="로그아웃"
        title="로그아웃"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
