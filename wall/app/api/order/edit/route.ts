// app/api/order/edit/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface EditItemPayload {
  product_id: number;
  quantity: number;
  price_at_sale: number;
  cost_at_sale: number;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { order_id, total_amount, items } = body;

    // 1. อัปเดตบิลหลัก (เปลี่ยนยอดรวม และเปลี่ยนสถานะเป็น confirmed)
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ total_amount: total_amount, status_order: 'confirmed' })
      .eq('id', order_id);

    if (orderError) throw orderError;

    // 2. ลบรายการสินค้าเดิมในบิลนี้ทิ้งให้หมด
    const { error: deleteError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', order_id);

    if (deleteError) throw deleteError;

    // 3. นำรายการสินค้าใหม่ที่แก้ไขแล้ว บันทึกเข้าไปแทนที่
    const orderItems = items.map((item: EditItemPayload) => ({
      order_id: order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: item.price_at_sale,
      cost_at_sale: item.cost_at_sale
    }));

    const { error: insertError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Error editing order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขบิล" },
      { status: 500 }
    );
  }
}