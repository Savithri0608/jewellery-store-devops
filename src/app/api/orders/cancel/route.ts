
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ownerId = process.env.OWNER_USER_ID;

    // Check environment configuration
    if (!supabaseUrl || !anonKey || !serviceKey || !ownerId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify the logged-in user
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7);

    const authClient = createClient(supabaseUrl, anonKey);

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user || user.id !== ownerId) {
      return NextResponse.json(
        { error: "You are not authorized to cancel orders" },
        { status: 403 }
      );
    }

    // Validate request
    const body = await request.json();
    const { order_id } = body;

    if (
      typeof order_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        order_id
      )
    ) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Use service role only after owner authentication
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data, error } = await adminClient.rpc(
      "cancel_order",
      { p_order_id: order_id }
    );

    if (error) {
      console.error("Cancellation error:", error);

      return NextResponse.json(
        { error: "Unable to cancel order" },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Cancellation API error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
