// 
"use client";
import { useState }     from 'react';
import { useAuth }      from "@/app/login/useAuth";

export default function Components_profile() {

  const [isOpen, setIsOpen] = useState(false);

  const { userId, handleLogout } = useAuth();
  const isLoggedIn = userId !== null;

  return (
    <div className="relative">
      <button         
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
        isLoggedIn ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
      >
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="black"
          stroke="currentColor" //สีของขอบ
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
          
          {isLoggedIn ? (
            <button 
              onClick={async () => {
                  await handleLogout();     // รอเคลียร์ค่า session ให้เสร็จสมบูรณ์
                  setIsOpen(false);         // ปิด dropdown เมนู
                  window.location.reload()     
                  
                }}
              className="px-4 py-2 text-sm text-gray-800"
            >
              ออกจากระบบ
            </button>
          
          ) : (
            <div className="px-4 py-2 text-sm text-gray-800">
              กรุณาเข้าสู่ระบบ
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
