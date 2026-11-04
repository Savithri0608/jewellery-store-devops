
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // 1. Check server environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // 2. Create server-side Supabase client
    const supabase = createClient(supabaseUrl, serviceKey);

    // 3. Read request body
    const body = await request.json();

    const {
      customer_name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      payment_method,
      items,
    } = body;

    // 4. Validate customer information
    if (
      typeof customer_name !== "string" ||
      !customer_name.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      typeof city !== "string" ||
      !city.trim() ||
      typeof state !== "string" ||
      !state.trim() ||
      typeof pincode !== "string" ||
      !pincode.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide all required customer details" },
        { status: 400 }
      );
    }

    // 5. Validate phone number
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    // 6. Validate PIN code
    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit PIN code" },
        { status: 400 }
      );
    }

    // 7. Validate payment method
    if (!["COD", "UPI"].includes(payment_method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // 8. Validate cart
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return NextResponse.json(
        { error: "Your cart is empty or invalid" },
        { status: 400 }
      );
    }

    // 9. Validate and combine duplicate product IDs
    const quantities = new Map<string, number>();

    for (const item of items) {
      if (
        !item ||
        typeof item.product_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item.product_id
        ) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > 100
      ) {
        return NextResponse.json(
          { error: "Invalid cart item" },
          { status: 400 }
        );
      }

      const newQuantity =
        (quantities.get(item.product_id) || 0) + item.quantity;

      if (newQuantity > 100) {
        return NextResponse.json(
          { error: "Invalid product quantity" },
          { status: 400 }
        );
      }

      quantities.set(item.product_id, newQuantity);
    }

    // 10. Check products before placing the order
    const productIds = Array.from(quantities.keys());

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, name, stock, is_active")
      .in("id", productIds);

    if (
      productError ||
      !products ||
      products.length !== productIds.length
    ) {
      return NextResponse.json(
        { error: "One or more products could not be found" },
        { status: 400 }
      );
    }

    for (const product of products) {
      const quantity = quantities.get(product.id)!;

      if (!product.is_active || product.stock < quantity) {
        return NextResponse.json(
          {
            error: `${product.name} is unavailable or has insufficient stock`,
          },
          { status: 400 }
        );
      }
    }

    // 11. Place order atomically through PostgreSQL
    const { data: result, error: orderError } = await supabase.rpc(
      "place_order",
      {
        p_customer: {
          customer_name: customer_name.trim(),
          phone: phone.trim(),
          email:
            typeof email === "string" ? email.trim() : "",
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          payment_method,
        },
        p_items: Array.from(quantities.entries()).map(
          ([product_id, quantity]) => ({
            product_id,
            quantity,
          })
        ),
      }
    );

    // 12. Handle database errors
    if (orderError) {
      console.error("Order placement failed:", orderError);

      return NextResponse.json(
        {
          error:
            "Unable to place order. Please check product availability and try again.",
        },
        { status: 400 }
      );
    }

    // 13. Return successful order response
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while placing your order" },
      { status: 500 }
    );
  }
}
