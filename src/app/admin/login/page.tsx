
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6] px-5">
      <div className="w-full max-w-md rounded-xl border border-[#eee7dc] bg-white p-8 shadow-sm">
        <h1 className="text-center font-serif text-3xl tracking-widest text-[#a9824b]">
          JEWELLERY STORE
        </h1>

        <p className="mt-3 text-center text-sm text-gray-500">
          Owner Administration Portal
        </p>

        <form onSubmit={handleLogin} className="mt-10 space-y-5">
          <div>
            <label className="mb-2 block text-sm">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-[#a9824b]"
              placeholder="Owner email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-[#a9824b]"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#a9824b] py-3 text-white transition hover:bg-[#98713e] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "OWNER LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
