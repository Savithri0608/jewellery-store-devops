"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function checkLogin() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/admin/login");
        return;
      }

      setEmail(data.user.email || "");
    }

    checkLogin();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-[#29251f]">
          Jewellery Store Admin
        </h1>

        <p className="mt-3 text-gray-600">
          Welcome, {email}
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 rounded-lg bg-[#29251f] px-5 py-3 text-white"
        >
          Logout
        </button>
      </div>
    </main>
  );
}