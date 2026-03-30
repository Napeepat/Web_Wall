import { useState } from "react";
import { authService } from "@/app/login/auth.service";

interface PinFormProps {
  mode: "SET_PIN" | "ENTER_PIN";
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  setError: (msg: string) => void;
}

export default function PinForm({ mode, userId, onSuccess, onCancel, setError }: PinFormProps) {
  const [pin, setPin] = useState("");

  // ดึง Logic การส่งข้อมูลออกมา เพื่อให้เรียกใช้ได้อัตโนมัติ
  const processSubmit = async (currentPin: string) => {
    setError("");

    if (currentPin.length !== 6) {
      setError("กรุณากรอก PIN 6 หลัก");
      return;
    }

    if (mode === "SET_PIN") {
      // บันทึก PIN ลง Database
      const { error } = await authService.updateUserPin(userId, currentPin);
      if (error) {
        setError("ไม่สามารถบันทึก PIN ได้");
      } else {
        onSuccess();
      }
    } else {
      // ตรวจสอบ PIN จาก Database
      const { data: profile, error } = await authService.getUserProfile(userId);
      if (error || profile?.pin !== currentPin) {
        setError("PIN ไม่ถูกต้อง กรุณาลองใหม่");
        setPin(""); // รีเซ็ต PIN ให้กดใหม่ถ้าผิด
      } else {
        onSuccess();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSubmit(pin);
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      
      // ถ้าตัวเลขที่เพิ่งกดเข้ามาทำให้ครบ 6 หลักปุ๊บ สั่ง Submit ทันที!
      if (newPin.length === 6) {
        processSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-6 text-center">
          PIN 6 หลัก
        </label>

        {/* ส่วนแสดงผลจุด PIN */}
        <div className="flex justify-center gap-4 mb-8">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                index < pin.length ? "bg-black border-black" : "border-gray-300"
              }`}
            />
          ))}
        </div>

        {/* แป้นกดตัวเลข (Numpad) */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 max-w-60 mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num.toString())}
              className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl font-medium text-black hover:bg-gray-200 focus:outline-none transition-colors mx-auto shadow-sm"
            >
              {num}
            </button>
          ))}
          <div></div>
          <button
            type="button"
            onClick={() => handleNumberClick("0")}
            className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl font-medium text-black hover:bg-gray-200 focus:outline-none transition-colors mx-auto shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 flex items-center justify-center text-lg text-gray-600 hover:text-black focus:outline-none mx-auto"
          >
            ลบ
          </button>
        </div>
      </div>

      {/* ซ่อนปุ่ม Submit ไว้เพื่อรักษาโครงสร้าง Form เดิม แต่ผู้ใช้ไม่ต้องกดแล้ว */}
      <button type="submit" className="hidden">
        {mode === "SET_PIN" ? "บันทึก PIN" : "ยืนยัน"}
      </button>

      {mode === "ENTER_PIN" && (
        <button 
          type="button" 
          onClick={onCancel}
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          เข้าสู่ระบบด้วยบัญชีอื่น
        </button>
      )}
    </form>
  );
}