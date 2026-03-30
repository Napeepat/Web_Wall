// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabaseAdmin = createClient( // สร้างตัวเชื่อมต่อพิเศษโดยใช้ SERVICE ROLE KEY
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role, pin, name, vehicle_reg');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "ดึงข้อมูล profiles ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}