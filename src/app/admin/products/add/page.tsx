
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function AddProduct() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Earrings");
  const [jewelleryType, setJewelleryType] = useState("Artificial");
  const [stock, setStock] = useState("0");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Check owner login
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !userData.user) {
        router.replace("/admin/login");
        return;
      }

      if (!imageFile) {
        setError("Please select a product image.");
        setSaving(false);
        return;
      }

      // Validate image size (maximum 5 MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5 MB.");
        setSaving(false);
        return;
      }

      // Generate a unique image filename
      const fileExtension = imageFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public image URL
      const { data: imageData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const imageUrl = imageData.publicUrl;

      // Save product details in Supabase database
      const { error: insertError } = await supabase
        .from("products")
        .insert({
          name,
          description,
          price: Number(price),
          category,
          jewellery_type: jewelleryType,
          stock: Number(stock),
          image_urls: [imageUrl],
          is_active: true,
        });

      if (insertError) {
        throw new Error(insertError.message);
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

  return (
    <main className="min-h-screen bg-[#fcfaf6] p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-semibold text-[#29251f]">
          Add New Product
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
              placeholder="Golden Pearl Earrings"
            />
          </div>

          <div>
            <label className="mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Describe your jewellery..."
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
              placeholder="799"
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
            <label className="mb-2 block">Upload Product Image</label>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
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
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#29251f] p-3 text-white disabled:opacity-50"
          >
            {saving ? "Uploading and Saving..." : "Save Product"}
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
