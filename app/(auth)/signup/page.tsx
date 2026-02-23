"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      setError(
        "현재 인증 설정상 이메일 확인이 필요합니다. Supabase Auth 설정에서 Confirm email을 꺼주세요."
      );
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <div className="from-sky-50 via-white to-emerald-50 flex min-h-screen items-start sm:items-center justify-center px-3 sm:px-6 pt-2 sm:pt-6 pb-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl sm:rounded-3xl bg-white shadow-xl p-4 sm:p-8 border border-slate-100">
          <div className="text-center mb-4 sm:mb-8">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-800">
              🌿 Habit Flow
            </div>
            <p className="mt-2 text-sm text-slate-500">
              이메일과 비밀번호로 계정을 만드세요
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
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
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="6자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            {error ? (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 sm:py-3 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="text-slate-800 font-medium hover:underline">
              로그인
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
