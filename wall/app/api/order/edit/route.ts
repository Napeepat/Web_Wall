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
    const { order_id, total_amount, paid_amount, items, status_order = 'confirmed' } = body;

    // ดึงข้อมูลบิล ก่อนอัปเดต เพื่อเช็คสถานะเดิม
    const { data: oldOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('status_order, wallman_id')
      .eq('id', order_id)
      .single();

    if (fetchError) throw fetchError;

    // อัปเดตบิลหลัก เปลี่ยนยอดรวม และเปลี่ยนสถานะ
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ total_amount: total_amount,
                paid_amount: paid_amount,
                status_order: status_order 
              })
      .eq('id', order_id);

    if (orderError) throw orderError;

    // ลบรายการสินค้าเดิมในบิลนี้ทิ้งให้หมด
    const { error: deleteError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', order_id);

    if (deleteError) throw deleteError;

    // นำรายการสินค้าใหม่ที่แก้ไขแล้ว บันทึกเข้าไปแทนที่
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
    
    // ถ้าเปลี่ยนสถานะมาเป็น confirmed ครั้งแรก ให้เพิ่มหนี้
    if (oldOrder.status_order !== 'confirmed' && status_order === 'confirmed') {
      const unpaidAmount = total_amount - paid_amount;
      if (unpaidAmount > 0) {

        // ดึงยอดหนี้ปัจจุบันของพนักงานออกมา
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('current_debt')
          .eq('id', oldOrder.wallman_id)
          .single();
        
          const currentDebt = Number(profile?.current_debt || 0);

          // บันทึกยอดหนี้ใหม่ (หนี้เดิม + ส่วนค้างชำระบิลนี้)
          await supabaseAdmin
            .from('profiles')
            .update({ current_debt: currentDebt + unpaidAmount })
            .eq('id', oldOrder.wallman_id);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Error editing order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขบิล" },
      { status: 500 }
    );
  }
}