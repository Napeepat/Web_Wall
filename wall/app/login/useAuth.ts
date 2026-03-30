// app/login/useAuth.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/login/auth.service";

export type AuthStep =
  | "LOADING"
  | "LOGIN"
  | "SET_PIN"
  | "ENTER_PIN"
  | "AUTHENTICATED";

export interface UserProfile {
  id: string;
  email: string | null;
  role: 'wallman' | 'admin';
  pin: string | null;
  name: string | null;
  vehicle_reg: string | null;
  current_debt: number;
}

export function useAuth() {
  const [step, setStep] = useState<AuthStep>("LOADING");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // เก็บค่าสถานะ
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // เก็บข้อมูล profile
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await authService.getSession();

        console.log("กำลังดึงข้อมูล")

        if (!isMounted) return;

        if (session?.user) {
          setUserId(session.user.id);

          const { data: profileData } = await authService.getUserProfile(
            session.user.id,
          );
          

          if (!isMounted) return;

          if (profileData) {
            setUserProfile(profileData as UserProfile);
            setRole(profileData.role);

            if (profileData.pin) {
              setStep("ENTER_PIN");
            } else {
              setStep("SET_PIN");
            }
          } else {
            setStep("SET_PIN");
          }
        } else {
          setStep("LOGIN");
        }
      } catch (err) {
        console.error(err);
        setStep("LOGIN");
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setUserId(null);
    setRole(null);            // ล้าง role ค่าตอนออกระบบ
    setUserProfile(null);     // ล้างค่า profile ตอนออกระบบ
    setStep("LOGIN");
    setError("");
  };

  return {
    step,
    setStep,
    error,
    setError,
    userId,
    handleLogout,
    role, //ส่ง role ออกไปให้หน้าอื่นใช้
    userProfile, // ส่ง userProfile ทั้งก้อนออกไปให้หน้าอื่นใช้ได้เลย
    router,
  };
}
