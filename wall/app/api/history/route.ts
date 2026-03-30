// app/api/history/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // รับค่า userId และ role จาก URL (Query Parameters)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    let query = supabaseAdmin // สร้าง Query ดึงข้อมูลบิล (orders) โยงกับโปรไฟล์ (profiles) และสินค้าย่อย (order_items โยงไป product)
      .from('orders')
      .select(`
        id,
        order_date,
        pickup_time,
        total_amount,
        paid_amount,
        status_order,
        profiles ( name ),
        order_items (
          product_id,
          quantity,
          price_at_sale,
          subtotal,
          product ( nameproduct )
        )
      `)
      .order('order_date', { ascending: false }); // เรียงจากบิลใหม่ล่าสุดไปเก่า

    
    if (role === 'wallman') { // ถ้าเป็น wallman ให้กรองเอาเฉพาะบิลของตัวเอง
      query = query.eq('wallman_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error fetching history:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงประวัติ";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}