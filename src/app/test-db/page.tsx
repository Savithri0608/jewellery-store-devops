
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TestDatabase() {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("products")
        .select("id")
        .limit(1);

      if (error) {
        setStatus("Connection failed: " + error.message);
      } else {
        setStatus("Successfully connected to Supabase!");
        console.log("Products:", data);
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6]">
      <div className="rounded-xl bg-white p-10 shadow-lg">
        <h1 className="mb-4 text-2xl font-serif">
          Database Connection Test
        </h1>
        <p>{status}</p>
      </div>
    </main>
  );
}
