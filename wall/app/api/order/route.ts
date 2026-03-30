// app/api/order/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface OrderItemPayload {
  product_id: number;
  quantity: number;
  price_at_sale: number;
  cost_at_sale: number;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallman_id, total_amount, paid_amount, pickup_time, items } = body;

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        wallman_id: wallman_id,
        total_amount: total_amount,
        paid_amount: paid_amount,
        pickup_time: pickup_time || null,
        status_order: "pending",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item: OrderItemPayload) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: item.price_at_sale,
      cost_at_sale: item.cost_at_sale,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", orderData.id);
      throw itemsError;
    }

    return NextResponse.json({ success: true, order_id: orderData.id });
  } catch (error: unknown) {
    // เปลี่ยนตรงนี้จาก error: any เป็น error: unknown
    console.error("Error creating order:", error);

    // แปลง error ให้อยู่ในรูปแบบที่อ่านข้อความได้
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกบิล";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
