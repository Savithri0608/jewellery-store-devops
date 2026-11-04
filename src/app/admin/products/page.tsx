"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const LOW_STOCK_THRESHOLD = 5;

type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export default function ProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");

  // Quick stock update state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [newStock, setNewStock] = useState("");
  const [stockReason, setStockReason] = useState("New stock received");
  const [savingStock, setSavingStock] = useState(false);
  const [stockError, setStockError] = useState("");
  const [stockMessage, setStockMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    loadProducts();
  }, [router]);

  // Inventory statistics
  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= LOW_STOCK_THRESHOLD
  );

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) <= 0
  );

  const inStockProducts = products.filter(
    (product) => Number(product.stock) > LOW_STOCK_THRESHOLD
  );

  // Search and filter products
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      (product.category || "").toLowerCase().includes(search);

    const stock = Number(product.stock);

    let matchesStock = true;

    if (stockFilter === "IN_STOCK") {
      matchesStock = stock > LOW_STOCK_THRESHOLD;
    } else if (stockFilter === "LOW_STOCK") {
      matchesStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    } else if (stockFilter === "OUT_OF_STOCK") {
      matchesStock = stock <= 0;
    }

    return matchesSearch && matchesStock;
  });

  function clearFilters() {
    setSearchTerm("");
    setStockFilter("ALL");
  }

  function getStockStatus(stock: number) {
    if (stock <= 0) {
      return {
        label: "Out of Stock",
        style: "bg-red-100 text-red-700",
      };
    }

    if (stock <= LOW_STOCK_THRESHOLD) {
      return {
        label: "Low Stock",
        style: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "In Stock",
      style: "bg-green-100 text-green-700",
    };
  }

  // Open quick stock update popup
  function openStockUpdate(product: any) {
    setSelectedProduct(product);
    setNewStock(String(product.stock));
    setStockReason("New stock received");
    setStockError("");
    setStockMessage("");
  }

  // Close popup
  function closeStockUpdate() {
    if (savingStock) return;

    setSelectedProduct(null);
    setNewStock("");
    setStockReason("New stock received");
    setStockError("");
  }

  // Save updated stock and record stock movement
  async function handleStockUpdate() {
    if (!selectedProduct) return;

    const stockValue = newStock.trim();

    if (!/^\d+$/.test(stockValue)) {
      setStockError("Please enter a valid whole number.");
      return;
    }

    const stockQuantity = Number(stockValue);

    if (!Number.isSafeInteger(stockQuantity)) {
      setStockError("Please enter a valid stock quantity.");
      return;
    }

    setSavingStock(true);
    setStockError("");

    try {
      const { data, error } = await supabase.rpc("update_product_stock", {
        p_product_id: selectedProduct.id,
        p_new_stock: stockQuantity,
        p_reason: stockReason,
      });

      if (error) throw error;

      const updatedStock = Number(data?.new_stock);

      if (!Number.isFinite(updatedStock)) {
        throw new Error(
          "Stock was updated, but the server returned an unexpected response."
        );
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, stock: updatedStock }
            : product
        )
      );

      setStockMessage(
        `Stock updated successfully for ${selectedProduct.name}. History recorded: ${stockReason}.`
      );

      setSelectedProduct(null);
      setNewStock("");
      setStockReason("New stock received");
    } catch (err) {
      console.error("Stock update error:", err);

      setStockError(
        err instanceof Error
          ? err.message
          : "Unable to update stock. Please try again."
      );
    } finally {
      setSavingStock(false);
    }
  }

  // Soft delete product
  async function handleDelete(product: any) {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${product.name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .update({
        is_active: false,
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
    <main className="min-h-screen bg-[#fcfaf6] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#29251f]">
              Product Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your jewellery catalogue and inventory.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Inventory Statistics */}
        {!loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total Products</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#29251f]">
                {totalProducts}
              </h2>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">In Stock</p>
              <h2 className="mt-2 text-3xl font-semibold text-green-700">
                {inStockProducts.length}
              </h2>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Low Stock</p>
              <h2 className="mt-2 text-3xl font-semibold text-yellow-600">
                {lowStockProducts.length}
              </h2>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Out of Stock</p>
              <h2 className="mt-2 text-3xl font-semibold text-red-600">
                {outOfStockProducts.length}
              </h2>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {!loading && lowStockProducts.length > 0 && (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <h2 className="font-semibold text-yellow-800">
              Low Stock Alert
            </h2>

            <p className="mt-1 text-sm text-yellow-700">
              {lowStockProducts.length} product(s) have 5 or fewer units remaining.
              Consider restocking them.
            </p>
          </div>
        )}

        {/* Out of Stock Alert */}
        {!loading && outOfStockProducts.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Out of Stock Alert
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {outOfStockProducts.length} product(s) are currently unavailable.
            </p>
          </div>
        )}

        {/* Stock Update Success Message */}
        {stockMessage && (
          <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {stockMessage}
          </div>
        )}

        {/* Products Section */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

          {/* Products Header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium">
                Active Products
              </h2>

              <span className="text-sm text-gray-500">
                {products.length} products
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/admin/products/inactive")}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
              >
                Inactive Products
              </button>
              <button
                onClick={() => router.push("/admin/products/stock-history")}
                className="rounded-lg border border-[#a78a59] px-4 py-2 text-[#806b4e] hover:bg-[#f4eee3]"
              >
               Stock History
              </button>
              <button
                onClick={() => router.push("/admin/products/add")}
                className="rounded-lg bg-[#29251f] px-4 py-2 text-white hover:bg-[#51483c]"
              >
                + Add Product
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 rounded-xl border border-gray-100 bg-[#fcfaf6] p-4">
            <h3 className="mb-3 font-medium text-[#29251f]">
              Search and Filter Inventory
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name or category..."
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-[#a78a59]"
              />

              <select
                value={stockFilter}
                onChange={(e) =>
                  setStockFilter(e.target.value as StockFilter)
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-[#a78a59]"
              >
                <option value="ALL">All Products</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              <button
                onClick={clearFilters}
                className="rounded-lg border border-[#a78a59] px-4 py-3 text-[#806b4e] hover:bg-[#f4eee3]"
              >
                Clear Filters
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {/* Product List */}
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No active products found.</p>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl bg-[#fcfaf6] p-10 text-center">
              <h3 className="font-medium text-[#29251f]">
                No matching products found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try another search term or inventory filter.
              </p>

              <button
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-[#29251f] px-5 py-2 text-white"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(
                  Number(product.stock)
                );

                return (
                  <div
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b pb-4"
                  >
                    {/* Product Details */}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {product.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {product.category} · ₹{product.price}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-gray-500">
                          Stock: {product.stock}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${stockStatus.style}`}
                        >
                          {stockStatus.label}
                        </span>

                        <span className="text-xs text-gray-400">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openStockUpdate(product)}
                        className="rounded-lg border border-[#a78a59] px-4 py-2 text-sm text-[#806b4e] hover:bg-[#f4eee3]"
                      >
                        Update Stock
                      </button>

                      <button
                        onClick={() =>
                          router.push(
                            `/admin/products/edit/${product.id}`
                          )
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stock Update Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeStockUpdate}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-[#29251f]">
                Update Product Stock
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Product:{" "}
                <span className="font-medium text-gray-800">
                  {selectedProduct.name}
                </span>
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Current stock: {selectedProduct.stock} units
              </p>

              <label className="mt-5 block text-sm font-medium text-gray-700">
                New Stock Quantity
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={newStock}
                onChange={(e) => {
                  setNewStock(e.target.value);
                  setStockError("");
                }}
                disabled={savingStock}
                placeholder="Enter new stock quantity"
                className="mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-[#a78a59] disabled:bg-gray-100"
              />

              <label className="mt-5 block text-sm font-medium text-gray-700">
                Reason for Stock Change
              </label>

              <select
                value={stockReason}
                onChange={(e) => {
                  setStockReason(e.target.value);
                  setStockError("");
                }}
                disabled={savingStock}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-[#a78a59] disabled:bg-gray-100"
              >
                <option value="New stock received">New stock received</option>
                <option value="Damaged items">Damaged items</option>
                <option value="Manual correction">Manual correction</option>
                <option value="Other">Other</option>
              </select>

              {stockError && (
                <p className="mt-2 text-sm text-red-600">
                  {stockError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeStockUpdate}
                  disabled={savingStock}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleStockUpdate}
                  disabled={savingStock}
                  className="rounded-lg bg-[#29251f] px-5 py-2 text-white hover:bg-[#51483c] disabled:opacity-50"
                >
                  {savingStock ? "Saving..." : "Save Stock"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}