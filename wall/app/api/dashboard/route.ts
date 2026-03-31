// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (role === 'wallman') { // ดึงข้อมูลดิบของ Wallman
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('id, order_date, total_amount, paid_amount, status_order')
        .eq('wallman_id', userId)
        .in('status_order', ['confirmed', 'completed','pending']) // 
        .order('order_date', { ascending: false });

      if (error) throw error;

      // ดึงค่า current_debt จากตาราง profiles ของผู้ใช้
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('current_debt')
        .eq('id', userId)
        .single();

      return NextResponse.json({ orders,
                                 current_debt: profile?.current_debt || 0
      });
    }

    if (role === 'admin') { // ดึงข้อมูลดิบของ Admin
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          id, order_date, total_amount, paid_amount, status_order,
          order_items ( quantity, cost_at_sale )
        `)
        .in('status_order', ['confirmed', 'completed'])
        .order('order_date', { ascending: false });

      if (error) throw error;

      // คำนวณยอดหนี้รวมของทุกคนจากตาราง profiles โดยตรง
      const { data: profiles } = await supabaseAdmin.from('profiles').select('current_debt');
      const totalDebtAll = profiles?.reduce((sum, p) => sum + Number(p.current_debt || 0), 0) || 0;

      return NextResponse.json({ orders,
                                 totalDebtAll
       });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}