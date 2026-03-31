// app/api/product/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("product")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}


// สำหรับอัปเดตข้อมูลสถานะของสินค้า
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, statusproduct } = body;

    if (!id || !statusproduct) { 
      return NextResponse.json(
        { error: "Missing required fields (id, statusproduct)" },
        { status: 400 }
      );
    }

    
    const numericId = Number(id); // แปลง id ให้เป็นตัวเลข

    const { data, error } = await supabase 
      .from("product")
      .update({ statusproduct })
      .eq("id", numericId) // <--- แก้ไขตรงนี้
      .select();
    //console.log("Supabase Result:", { data, error });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating product status:", error);
    return NextResponse.json(
      { error: "Failed to update product status" },
      { status: 500 }
    );
  }
}