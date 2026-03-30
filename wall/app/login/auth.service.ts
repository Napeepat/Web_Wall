// app/login/auth.service.ts
import { supabase } from "@/app/lib/supabase";

export const authService = {
  async getSession() { // ดึงข้อมูล Session ปัจจุบัน
    return await supabase.auth.getSession();
  },

  async signIn(email: string, password: string) { // ล็อกอินด้วย Email/Password
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() { // ออกจากระบบ
    return await supabase.auth.signOut();
  },

  async getUserProfile(userId: string) { // ดึงข้อมูล Profile
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  },

    async updateUserPin(userId: string, pin: string) { // อัปเดต/ตั้งค่า PIN ลงฐานข้อมูล
    return await supabase
        .from('profiles')
        .upsert(
        {
            id: userId,
            pin: pin
        },
        { onConflict: 'id' }
        );
    }
};