
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment_method: "COD",
  });

 useEffect(() => {
  const savedCart = localStorage.getItem("jewellery-cart");

  if (savedCart) {
    try {
      const parsedCart = JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {
        // Restore saved cart after browser hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(parsedCart);
      }
    } catch {
      localStorage.removeItem("jewellery-cart");
    }
  }

  setCartLoaded(true);
}, []);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePlaceOrder = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to place order."
        );
      }

      localStorage.removeItem("jewellery-cart");
      setCart([]);

      setSuccess(
        `Your order has been placed! Order ID: ${result.order_id}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!cartLoaded) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <p className="text-[#806b4e]">
          Loading checkout...
        </p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center p-6">
        <div className="bg-white max-w-lg w-full p-10 text-center rounded-2xl shadow-sm">
          <div className="text-5xl mb-5">✓</div>

          <h1 className="text-3xl font-serif text-[#8b7048] mb-4">
            Thank you!
          </h1>

          <p className="text-gray-600 mb-6">
            {success}
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Payment status: Pending. We will confirm your order shortly.
          </p>

          <button
            onClick={() => router.push("/")}
            className="bg-[#a78a59] text-white px-8 py-3 rounded-lg hover:bg-[#8b7048]"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-[#8b7048] mb-4">
            Your bag is empty
          </h1>

          <p className="text-gray-600 mb-6">
            Add something beautiful to your bag first.
          </p>

          <button
            onClick={() => router.push("/")}
            className="bg-[#a78a59] text-white px-8 py-3 rounded-lg"
          >
            Explore Jewellery
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f3] py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.3em] text-[#a78a59] mb-3">
            JEWELLERY STORE
          </p>

          <h1 className="text-4xl font-serif text-[#4b4032]">
            Checkout
          </h1>

          <p className="text-gray-500 mt-3">
            A little sparkle is on its way.
          </p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Customer Details */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm">

              <h2 className="text-2xl font-serif text-[#806b4e] mb-6">
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Full Name *
                  </label>

                  <input
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Mobile Number *
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Email (Optional)
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={254}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Full Address *
                  </label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    maxLength={500}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="House number, street, landmark..."
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    City *
                  </label>

                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    State *
                  </label>

                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    PIN Code *
                  </label>

                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#a78a59]"
                    placeholder="6-digit PIN code"
                  />
                </div>

              </div>

              {/* Payment Method */}
              <div className="mt-10">
                <h2 className="text-2xl font-serif text-[#806b4e] mb-5">
                  Payment Method
                </h2>

                <div className="space-y-4">

                  <label className="flex items-center gap-3 border border-gray-200 p-4 rounded-lg cursor-pointer hover:border-[#a78a59]">
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      checked={form.payment_method === "COD"}
                      onChange={handleChange}
                    />

                    <div>
                      <p className="font-medium text-gray-800">
                        Cash on Delivery
                      </p>

                      <p className="text-sm text-gray-500">
                        Pay when your jewellery arrives.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 border border-gray-200 p-4 rounded-lg cursor-pointer hover:border-[#a78a59]">
                    <input
                      type="radio"
                      name="payment_method"
                      value="UPI"
                      checked={form.payment_method === "UPI"}
                      onChange={handleChange}
                    />

                    <div>
                      <p className="font-medium text-gray-800">
                        UPI Payment
                      </p>

                      <p className="text-sm text-gray-500">
                        Payment verification will be required separately.
                      </p>
                    </div>
                  </label>

                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="mt-6 text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                  {error}
                </p>
              )}

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "32px",
                  padding: "16px",
                  backgroundColor: "#a78a59",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  visibility: "visible",
                  opacity: loading ? 0.6 : 1,
                  position: "relative",
                  zIndex: 10,
                }}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>

            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">

              <h2 className="text-2xl font-serif text-[#806b4e] mb-6">
                Order Summary
              </h2>

              <div className="space-y-5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">

                    <div className="w-16 h-16 bg-[#faf8f3] rounded-lg overflow-hidden shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {item.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>

                      <p className="text-sm text-[#8b7048] mt-1">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-5 space-y-3">

                <div className="flex justify-between text-gray-600">
                  <span>Items ({totalItems})</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>To be confirmed</span>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between font-semibold text-lg text-[#806b4e]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <p className="text-xs text-gray-400">
                  Final payable amount is calculated securely using product
                  prices stored in our database. Delivery charges, if any,
                  will be confirmed separately.
                </p>

              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}
