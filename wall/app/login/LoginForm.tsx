// app/login/LoginForm.tsx
"use client";

import { useAuth }      from "@/app/login/useAuth";
import EmailForm        from "@/app/login/emailForm";
import PinForm          from "@/app/login/pinForm";

import DownloadPage     from "@/app/components/download";
import DashboardPage    from "@/app/dashboard/page";

export default function LoginPage() {

  // ดึงค่าทุกอย่างมาจาก useAuth โดยตรง ไม่ต้องรับ Props แล้ว
  const { step, setStep, error, setError, userId, handleLogout } = useAuth();

  // ระหว่างรอตรวจสอบข้อมูลให้แสดง Loading
  if (step === "LOADING") { return <DownloadPage />; }

  // ล็อกอินและกรอก PIN สำเร็จแล้ว -> ให้แสดงเนื้อหา Dashboard
  if (step === "AUTHENTICATED") {return ( <DashboardPage /> ); }

  // 3. ถ้ายังไม่ล็อกอิน -> แสดงฟอร์ม Login
  return (
    <div className="flex justify-center items-center rounded-xl">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {step === "LOGIN" && "เข้าสู่ระบบ"}
          {step === "SET_PIN" && "ตั้งรหัส PIN 6 หลัก"}
          {step === "ENTER_PIN" && "กรอก PIN เพื่อเข้าใช้งาน"}
        </h2>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        {step === "LOGIN" && (
          <EmailForm 
            onSuccess={() => {
              window.location.reload(); 
            }} 
            setError={setError} 
          />
        )}

        {(step === "SET_PIN" || step === "ENTER_PIN") && userId && (
          <PinForm 
            mode={step}
            userId={userId}
            onSuccess={() => {
              setStep("AUTHENTICATED");
            }}
            onCancel={handleLogout}
            setError={setError}
          />
        )}
      </div>
    </div>
  );
}