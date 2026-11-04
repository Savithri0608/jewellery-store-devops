"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type StockMovement = {
  id: string;
  product_id: string | null;
  product_name: string;
  previous_stock: number;
  new_stock: number;
  quantity_changed: number;
  reason: string;
  created_by: string | null;
  created_at: string;
};

export default function StockHistoryPage() {
  const router = useRouter();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setMovements(data || []);
      }

      setLoading(false);
    }

    loadHistory();
  }, [router]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#29251f]">
              Stock Movement History
            </h1>

            <p className="mt-2 text-gray-600">
              Track every inventory adjustment made in your store.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/products")}
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Back to Products
          </button>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-medium text-[#29251f]">
              Inventory Activity
            </h2>

            <span className="rounded-full bg-[#f4eee3] px-4 py-2 text-sm text-[#806b4e]">
              {movements.length} records
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Loading stock history...
            </p>
          ) : error ? (
            <p className="rounded-lg bg-red-50 p-4 text-red-600">
              Unable to load stock history: {error}
            </p>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="font-medium text-gray-800">
                No stock movements yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Stock adjustments will appear here when you update product inventory.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b bg-[#fcfaf6] text-sm text-gray-600">
                    <th className="p-4">Product</th>
                    <th className="p-4">Previous Stock</th>
                    <th className="p-4">New Stock</th>
                    <th className="p-4">Change</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b text-sm hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium text-gray-900">
                        {movement.product_name}
                      </td>

                      <td className="p-4 text-gray-600">
                        {movement.previous_stock}
                      </td>

                      <td className="p-4 text-gray-600">
                        {movement.new_stock}
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-semibold ${
                            movement.quantity_changed > 0
                              ? "text-green-700"
                              : movement.quantity_changed < 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {movement.quantity_changed > 0 ? "+" : ""}
                          {movement.quantity_changed}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        {movement.reason}
                      </td>

                      <td className="p-4 whitespace-nowrap text-gray-500">
                        {formatDate(movement.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}