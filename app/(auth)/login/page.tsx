"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/"); // 로그인 성공 후 이동
  };

  return (
    <div className="from-sky-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl bg-white shadow-xl p-8 border border-slate-100">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="text-3xl font-semibold text-slate-800">
              🌿 Habit Flow
            </div>
            <p className="mt-2 text-sm text-slate-500">
              오늘의 루틴을 차분하게 시작해보세요
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="mx-3 text-xs text-slate-400">또는</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google Login */}
          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${location.origin}/auth/callback`,
                },
              });
            }}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50 transition"
          >
            Google로 로그인
          </button>

          {/* Signup */}
          <p className="mt-6 text-center text-sm text-slate-500">
            아직 계정이 없으신가요?{" "}
            <a
              href="/signup"
              className="text-slate-800 font-medium hover:underline"
            >
              회원가입
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
