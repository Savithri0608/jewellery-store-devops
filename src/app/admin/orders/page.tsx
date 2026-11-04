
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
];

const FILTER_STATUSES = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/admin/login");
        return;
      }

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      setOrders((data || []) as Order[]);
    } catch (err) {
      console.error("Orders loading error:", err);
      setError("Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load orders when the component mounts
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchOrders();
}, [fetchOrders]);

  // Filter orders using search text and selected status
  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      order.customer_name.toLowerCase().includes(search) ||
      order.phone.toLowerCase().includes(search) ||
      (order.email || "").toLowerCase().includes(search) ||
      order.id.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "ALL" ||
      order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    setError("");
    setMessage("");

    const previousOrders = orders;
    setUpdatingId(orderId);

    try {
      const { data, error: updateError } = await supabase
        .from("orders")
        .update({
          order_status: newStatus,
        })
        .eq("id", orderId)
        .select("id, order_status")
        .single();

      if (updateError) throw updateError;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? { ...order, order_status: data.order_status }
            : order
        )
      );

      setMessage(`Order status updated to ${newStatus}.`);
    } catch (err) {
      console.error("Status update error:", err);
      setOrders(previousOrders);
      setError(
        "Unable to update order status. Please check permissions."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Cancel order and restore stock
  const cancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? The purchased product quantities will be returned to stock."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setCancellingId(orderId);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Please log in again.");
      }

      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to cancel order.");
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? { ...order, order_status: "CANCELLED" }
            : order
        )
      );

      setMessage(
        "Order cancelled successfully. Product stock has been restored."
      );
    } catch (err) {
      console.error("Order cancellation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel order. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PLACED":
        return "bg-blue-100 text-blue-700";
      case "CONFIRMED":
        return "bg-yellow-100 text-yellow-700";
      case "SHIPPED":
        return "bg-purple-100 text-purple-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <p className="text-[#806b4e]">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f3] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <p className="text-sm tracking-widest text-[#a78a59]">
              JEWELLERY STORE
            </p>

            <h1 className="text-3xl font-serif text-[#4b4032] mt-2">
              Order Management
            </h1>

            <p className="text-gray-500 mt-2">
              View and manage customer orders.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchOrders}
              className="border border-[#a78a59] text-[#8b7048] px-5 py-3 rounded-lg hover:bg-[#f4eee3]"
            >
              Refresh
            </button>

            <button
              onClick={() => router.push("/admin/dashboard")}
              className="bg-[#a78a59] text-white px-5 py-3 rounded-lg hover:bg-[#8b7048]"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <h2 className="text-3xl font-semibold text-[#806b4e] mt-2">
              {orders.length}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Placed Orders</p>
            <h2 className="text-3xl font-semibold text-[#806b4e] mt-2">
              {orders.filter((o) => o.order_status === "PLACED").length}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Delivered Orders</p>
            <h2 className="text-3xl font-semibold text-[#806b4e] mt-2">
              {orders.filter((o) => o.order_status === "DELIVERED").length}
            </h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-8">
          <h2 className="text-lg font-semibold text-[#806b4e] mb-4">
            Search and Filter Orders
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, email or order ID..."
              className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 outline-none focus:border-[#a78a59]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 bg-white text-gray-700 outline-none focus:border-[#a78a59]"
            >
              {FILTER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Order Statuses" : status}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="border border-[#a78a59] text-[#8b7048] rounded-lg p-3 hover:bg-[#f4eee3]"
            >
              Clear Filters
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>

        {/* Order List */}
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center shadow-sm">
            <h2 className="text-xl font-serif text-[#806b4e]">
              No orders yet
            </h2>
            <p className="text-gray-500 mt-2">
              Customer orders will appear here.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center shadow-sm">
            <h2 className="text-xl font-serif text-[#806b4e]">
              No matching orders
            </h2>
            <p className="text-gray-500 mt-2">
              Try another search term or change the status filter.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 bg-[#a78a59] text-white px-5 py-3 rounded-lg hover:bg-[#8b7048]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-6"
              >

                {/* Order Header */}
                <div className="flex flex-wrap justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <p className="text-xs text-gray-400">ORDER ID</p>

                    <p className="font-medium text-gray-800 break-all">
                      {order.id}
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.order_status)}`}
                    >
                      {order.order_status}
                    </span>

                    <span className="text-sm text-gray-500">
                      Payment: {order.payment_status}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5">
                  <div>
                    <h3 className="font-semibold text-[#806b4e] mb-3">
                      Customer Details
                    </h3>

                    <p className="text-gray-800 font-medium">
                      {order.customer_name}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      Phone: {order.phone}
                    </p>

                    {order.email && (
                      <p className="text-sm text-gray-600 mt-1">
                        Email: {order.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#806b4e] mb-3">
                      Delivery Address
                    </h3>

                    <p className="text-sm text-gray-700">
                      {order.address}
                    </p>

                    <p className="text-sm text-gray-700">
                      {order.city}, {order.state} - {order.pincode}
                    </p>
                  </div>
                </div>

                {/* Ordered Products */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-semibold text-[#806b4e] mb-4">
                    Ordered Products
                  </h3>

                  <div className="space-y-4">
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4"
                      >
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg bg-[#faf8f3]"
                          />
                        )}

                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {item.product_name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>

                          <p className="text-sm text-gray-500">
                            Unit price: {formatCurrency(Number(item.unit_price))}
                          </p>
                        </div>

                        <p className="font-medium text-[#806b4e]">
                          {formatCurrency(Number(item.subtotal))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment and Total */}
                <div className="border-t border-gray-100 mt-5 pt-5 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Payment Method
                    </p>

                    <p className="font-medium text-gray-800">
                      {order.payment_method === "COD"
                        ? "Cash on Delivery"
                        : "UPI"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Order Total
                    </p>

                    <p className="text-2xl font-semibold text-[#806b4e]">
                      {formatCurrency(Number(order.total_amount))}
                    </p>
                  </div>
                </div>

                {/* Update Order Status and Cancellation */}
                <div className="border-t border-gray-100 mt-5 pt-5">
                  <label className="block text-sm font-semibold text-[#806b4e] mb-3">
                    Update Order Status
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={order.order_status}
                      disabled={
                        updatingId === order.id ||
                        cancellingId === order.id ||
                        order.order_status === "CANCELLED" ||
                        order.order_status === "DELIVERED"
                      }
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
                      className="border border-gray-200 rounded-lg p-3 bg-white text-gray-700 disabled:bg-gray-100"
                    >
                      {!ORDER_STATUSES.includes(order.order_status) && (
                        <option value={order.order_status}>
                          {order.order_status}
                        </option>
                      )}

                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    {updatingId === order.id && (
                      <span className="text-sm text-gray-500">
                        Updating...
                      </span>
                    )}

                    {order.order_status !== "CANCELLED" &&
                      order.order_status !== "DELIVERED" && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={
                            updatingId === order.id ||
                            cancellingId === order.id
                          }
                          className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === order.id
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}

                    {cancellingId === order.id && (
                      <span className="text-sm text-gray-500">
                        Restoring stock...
                      </span>
                    )}

                    {(order.order_status === "CANCELLED" ||
                      order.order_status === "DELIVERED") && (
                      <span className="text-xs text-gray-500">
                        This order is in a final status.
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
