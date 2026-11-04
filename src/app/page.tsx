
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  Search,
  ShoppingBag,
  Menu,
  Heart,
  ArrowRight,
  MessageCircle,
  X,
} from "lucide-react";

const categories = [
  {
    name: "Earrings",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700",
  },
  {
    name: "Necklaces",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700",
  },
  {
    name: "Rings",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700",
  },
  {
    name: "Bracelets",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700",
  },
];

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function Home() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching products:", error.message);
      } else {
        const formattedProducts = data.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          category: product.category,
          image: product.image_urls?.[0] || "",
        }));

        setProducts(formattedProducts);
      }

      setLoading(false);
    }

    fetchProducts();
  }, []);

  // Load saved cart from localStorage
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

  // Add product to cart
  const addToCart = (product: any) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          quantity: 1,
        },
      ];
    });
  };

  // Calculate total cart quantity
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Toggle favourites
  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#29251f]">

      {/* Announcement */}
      <div className="bg-[#a9824b] px-4 py-2 text-center text-xs tracking-[2px] text-white">
        A LITTLE LUXURY, A LOT OF LOVE
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#eee7dc] bg-[#fcfaf6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#" className="hover:text-[#a9824b]">Home</a>
            <a href="#collections" className="hover:text-[#a9824b]">Collections</a>
            <a href="#products" className="hover:text-[#a9824b]">Shop</a>
            <a href="#about" className="hover:text-[#a9824b]">Our Story</a>
          </nav>

          <a href="#" className="text-center">
            <span className="block text-xl font-serif tracking-[4px] text-[#a9824b] sm:text-2xl">
              JEWELLERY STORE
            </span>
            <span className="text-[9px] tracking-[4px] text-[#8b8174]">
              BEAUTY IN EVERY DETAIL
            </span>
          </a>

          <div className="flex items-center gap-4">
            <button aria-label="Search">
              <Search size={19} />
            </button>

            <button
              className="relative"
              aria-label="Shopping bag"
              onClick={() => router.push("/cart")}
            >
              <ShoppingBag size={20} />

              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#a9824b] text-[10px] text-white">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-4 border-t border-[#eee7dc] px-6 py-5 text-sm md:hidden">
            <a href="#">Home</a>
            <a href="#collections">Collections</a>
            <a href="#products">Shop</a>
            <a href="#about">Our Story</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[570px] items-center overflow-hidden bg-[#e9e1d4]">
        <img
          src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1800"
          alt="Elegant gold jewellery collection"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-7 py-24 text-white">
          <p className="mb-5 text-xs tracking-[5px] sm:text-sm">
            THE ART OF ELEGANCE
          </p>

          <h1 className="max-w-xl font-serif text-5xl leading-tight sm:text-7xl">
            Jewellery that tells your story.
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-white/85">
            Discover timeless designs made to celebrate your individuality,
            beauty and every special moment.
          </p>

          <a
            href="#products"
            className="mt-9 inline-flex items-center gap-3 bg-[#b18a52] px-8 py-4 text-xs tracking-[2px] transition hover:bg-[#98713e]"
          >
            EXPLORE COLLECTION <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 border-b border-[#eee7dc] px-6 py-9 text-center sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg">Thoughtful Designs</p>
          <p className="mt-1 text-xs text-[#8b8174]">Pieces for every occasion</p>
        </div>
        <div>
          <p className="font-serif text-lg">Quality You Can Trust</p>
          <p className="mt-1 text-xs text-[#8b8174]">Carefully selected jewellery</p>
        </div>
        <div>
          <p className="font-serif text-lg">Made for You</p>
          <p className="mt-1 text-xs text-[#8b8174]">A little elegance every day</p>
        </div>
      </section>

      {/* Categories */}
      <section id="collections" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[4px] text-[#a9824b]">FIND YOUR STYLE</p>
          <h2 className="mt-3 font-serif text-4xl">Explore Our Collections</h2>
          <p className="mt-3 text-sm text-[#8b8174]">
            Beautiful pieces for every version of you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <a href="#products" key={category.name} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-[#eee7dc]">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex items-center justify-between border-b border-[#e5dccf] py-4">
                <h3 className="font-serif text-lg">{category.name}</h3>
                <ArrowRight size={17} className="text-[#a9824b]" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="bg-[#f3efe8] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[4px] text-[#a9824b]">
                HANDPICKED FOR YOU
              </p>
              <h2 className="mt-3 font-serif text-4xl">Our Best Sellers</h2>
            </div>

            <a href="#products" className="flex items-center gap-2 text-sm">
              View all <ArrowRight size={16} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {loading ? (
              <p className="col-span-full py-10 text-center">
                Loading jewellery...
              </p>
            ) : products.length === 0 ? (
              <p className="col-span-full py-10 text-center">
                No products available at the moment.
              </p>
            ) : (
              products.map((product) => (
                <article key={product.id} className="group bg-[#fcfaf6]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute right-3 top-3 rounded-full bg-white/90 p-2"
                      aria-label="Add to favourites"
                    >
                      <Heart
                        size={17}
                        fill={
                          favorites.includes(product.id)
                            ? "#a9824b"
                            : "none"
                        }
                        color="#a9824b"
                      />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#a9824b]">
                      {product.category}
                    </p>

                    <h3 className="mt-2 font-serif text-base">
                      {product.name}
                    </h3>

                    <p className="mt-2 font-medium">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>

                    <button
                      onClick={() => addToCart(product)}
                      className="mt-4 w-full border border-[#a9824b] py-3 text-[10px] tracking-[2px] transition hover:bg-[#a9824b] hover:text-white"
                    >
                      ADD TO BAG
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section id="about" className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
        <div className="overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1000"
            alt="Elegant jewellery details"
            className="h-[450px] w-full object-cover"
          />
        </div>

        <div className="max-w-lg">
          <p className="text-xs tracking-[4px] text-[#a9824b]">
            OUR PHILOSOPHY
          </p>

          <h2 className="mt-5 font-serif text-5xl leading-tight">
            Beauty lies in the little details.
          </h2>

          <p className="mt-6 text-sm leading-8 text-[#786f63]">
            Jewellery is more than an accessory. It is a reflection
            of who you are, the memories you cherish and the moments
            you want to remember.
          </p>

          <a
            href="#products"
            className="mt-8 inline-flex items-center gap-3 border-b border-[#a9824b] pb-2 text-xs tracking-[2px]"
          >
            DISCOVER MORE <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#29251f] px-6 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          <div>
            <h2 className="font-serif text-2xl tracking-[3px] text-[#d3b17b]">
              JEWELLERY STORE
            </h2>

            <p className="mt-4 max-w-xs text-sm leading-7 text-white/60">
              A little luxury for every moment. Discover jewellery
              that makes you feel beautiful.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-xl">Quick Links</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/60">
              <a href="#">Home</a>
              <a href="#collections">Collections</a>
              <a href="#products">Shop</a>
              <a href="#about">Our Story</a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl">Stay Connected</h3>

            <p className="mt-4 text-sm text-white/60">
              Have questions? We'd love to hear from you.
            </p>

            <a
              href="https://wa.me/91YOURNUMBER"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-[#a9824b] px-5 py-3 text-sm"
            >
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/15 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Jewellery Store. All rights reserved.
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/91YOURNUMBER"
        target="_blank"
        rel="noreferrer"
        aria-label="Contact us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110"
      >
        <MessageCircle size={27} />
      </a>

    </main>
  );
}
