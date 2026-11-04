
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function InactiveProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInactiveProducts() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    loadInactiveProducts();
  }, [router]);

  async function handleRestore(product: any) {
    const confirmed = window.confirm(
      `Restore ${product.name} to the active product catalogue?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] p-8">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#29251f]">
              Inactive Products
            </h1>

            <p className="mt-2 text-gray-600">
              Restore products to your active catalogue.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/products")}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            Back to Products
          </button>
        </div>

        {/* Inactive Product List */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-medium">
            Deactivated Products ({products.length})
          </h2>

          {loading ? (
            <p>Loading inactive products...</p>
          ) : products.length === 0 ? (
            <p>No inactive products found.</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <h3 className="font-medium">
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {product.category} · ₹{product.price}
                    </p>

                    <p className="text-xs text-gray-500">
                      Stock: {product.stock} · Inactive
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestore(product)}
                    className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
