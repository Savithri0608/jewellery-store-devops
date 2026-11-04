
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Earrings");
  const [jewelleryType, setJewelleryType] = useState("Artificial");
  const [stock, setStock] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [oldImageUrl, setOldImageUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error || !data) {
        setError(error?.message || "Product not found.");
        setLoading(false);
        return;
      }

      setName(data.name);
      setDescription(data.description || "");
      setPrice(String(data.price));
      setCategory(data.category);
      setJewelleryType(data.jewellery_type);
      setStock(String(data.stock));
      setIsActive(data.is_active);
      setOldImageUrl(data.image_urls?.[0] || "");
      setImagePreview(data.image_urls?.[0] || "");

      setLoading(false);
    }

    if (productId) {
      loadProduct();
    }
  }, [productId, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let imageUrl = oldImageUrl;

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/admin/login");
        return;
      }

      // Upload replacement image if selected
      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error("Image size must be less than 5 MB.");
        }

        const fileExtension = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: imageData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = imageData.publicUrl;
      }

      // Update product in database
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name,
          description,
          price: Number(price),
          category,
          jewellery_type: jewelleryType,
          stock: Number(stock),
          image_urls: imageUrl ? [imageUrl] : [],
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Remove old image only after successful database update
      if (imageFile && oldImageUrl) {
        try {
          const oldPath = new URL(oldImageUrl).pathname.split(
            "/product-images/"
          )[1];

          if (oldPath) {
            const { error: deleteError } = await supabase.storage
              .from("product-images")
              .remove([decodeURIComponent(oldPath)]);

            if (deleteError) {
              console.error("Old image cleanup failed:", deleteError.message);
            }
          }
        } catch (cleanupError) {
          console.error("Old image cleanup failed:", cleanupError);
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-8">Loading product...</main>;
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-semibold text-[#29251f]">
          Edit Product
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block">Product Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block">Price (₹)</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option>Earrings</option>
              <option>Necklaces</option>
              <option>Bracelets</option>
              <option>Rings</option>
              <option>Anklets</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block">Jewellery Type</label>
            <select
              value={jewelleryType}
              onChange={(e) => setJewelleryType(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option>Artificial</option>
              <option>Gold</option>
              <option>Silver</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block">Stock Quantity</label>
            <input
              required
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block">Product Image</label>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
              className="w-full rounded-lg border p-3"
            />

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Product preview"
                className="mt-4 h-40 w-40 rounded-lg object-cover"
              />
            )}

            <p className="mt-2 text-xs text-gray-500">
              Select a new image only if you want to replace the existing one.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive">Active product</label>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#29251f] p-3 text-white disabled:opacity-50"
          >
            {saving ? "Updating Product..." : "Update Product"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="w-full rounded-lg border p-3"
          >
            Cancel
          </button>
        </form>
      </div>
    </main>
  );
}
