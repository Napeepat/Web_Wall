// app/api/profile/debt/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, payAmount } = body;

    if (!userId || payAmount === undefined || payAmount <= 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    // 1. ดึงยอดหนี้ปัจจุบันของพนักงานจากฐานข้อมูล
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('current_debt')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentDebt = Number(profile?.current_debt || 0);
    const newDebt = currentDebt - Number(payAmount);

    // อัปเดตยอดหนี้ใหม่ (ถ้าลบแล้วติดลบ ให้เซ็ตเป็น 0)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ current_debt: newDebt < 0 ? 0 : newDebt })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newDebt: newDebt < 0 ? 0 : newDebt });

  } catch (error: unknown) {
    console.error("Error updating debt:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลดยอดค้าง";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}