
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("jewellery-cart");

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch {
        localStorage.removeItem("jewellery-cart");
      }
    }

    setCartLoaded(true);
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem("jewellery-cart", JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  // Increase quantity
  function increaseQuantity(id: string) {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  // Decrease quantity
  function decreaseQuantity(id: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // Remove product
  function removeProduct(id: string) {
    setCart((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  // Calculate totals
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  if (!cartLoaded) {
    return (
      <main className="min-h-screen bg-[#fcfaf6] p-10 text-center">
        Loading your shopping bag...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#29251f]">

      {/* Header */}
      <header className="border-b border-[#eee7dc] px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm hover:text-[#a9824b]"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </button>

          <h1 className="font-serif text-xl tracking-[3px] text-[#a9824b]">
            JEWELLERY STORE
          </h1>

          <div className="flex items-center gap-2 text-sm">
            <ShoppingBag size={18} />
            {totalItems} Items
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-10">
          <p className="text-xs tracking-[4px] text-[#a9824b]">
            YOUR SELECTION
          </p>

          <h2 className="mt-3 font-serif text-4xl">
            Shopping Bag
          </h2>

          <p className="mt-3 text-sm text-[#8b8174]">
            Your favourite pieces, collected in one place.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag
              size={55}
              className="mx-auto text-[#c5b69f]"
            />

            <h3 className="mt-6 font-serif text-2xl">
              Your bag is waiting for something beautiful.
            </h3>

            <p className="mt-3 text-sm text-[#8b8174]">
              Explore our collection and find something you love.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-8 bg-[#a9824b] px-8 py-4 text-xs tracking-[2px] text-white hover:bg-[#98713e]"
            >
              EXPLORE COLLECTION
            </button>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-3">

            {/* Cart Items */}
            <div className="space-y-5 lg:col-span-2">

              {cart.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-5 border-b border-[#e5dccf] pb-6 sm:flex-row"
                >

                  {/* Product Image */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-36 w-full object-cover sm:w-32"
                  />

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col justify-between">

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-xl">
                          {item.name}
                        </h3>

                        <p className="mt-2 text-sm text-[#8b8174]">
                          ₹{item.price.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <button
                        onClick={() => removeProduct(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-[#a9824b] hover:text-red-600"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center border border-[#e5dccf]">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          aria-label="Decrease quantity"
                          className="p-2 hover:bg-[#eee7dc]"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-10 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item.id)}
                          aria-label="Increase quantity"
                          className="p-2 hover:bg-[#eee7dc]"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <p className="font-medium">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>

                  </div>
                </article>
              ))}

            </div>

            {/* Order Summary */}
            <aside className="h-fit bg-[#f3efe8] p-7">

              <h3 className="font-serif text-2xl">
                Order Summary
              </h3>

              <div className="mt-7 space-y-4 border-b border-[#ded4c5] pb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#786f63]">
                    Items ({totalItems})
                  </span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#786f63]">
                    Shipping
                  </span>

                  <span className="text-xs">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="mt-5 flex justify-between text-lg font-medium">
                <span>Subtotal</span>

                <span>
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="mt-8 w-full bg-[#a9824b] py-4 text-xs tracking-[2px] text-white transition hover:bg-[#98713e]"
              >
                PROCEED TO CHECKOUT
              </button>

              <p className="mt-5 text-center text-xs leading-6 text-[#8b8174]">
                Secure shopping experience.
                Thank you for choosing us.
              </p>

            </aside>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#eee7dc] py-8 text-center text-xs text-[#8b8174]">
        © {new Date().getFullYear()} Jewellery Store. All rights reserved.
      </footer>

    </main>
  );
}
