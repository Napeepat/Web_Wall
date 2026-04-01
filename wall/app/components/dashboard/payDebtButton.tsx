// app/components/dashboard/payDebtButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/login/useAuth";
import BackButton from "@/app/components/allButton/backIsOpen";

interface Profile {
    id: string;
    name: string;
    role: string;
}

export default function PayDebtButton() {
    const { role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    
    const [wallmen, setWallmen] = useState<Profile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [currentDebt, setCurrentDebt] = useState<number | null>(null);
    const [payAmount, setPayAmount] = useState<number | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ดึงรายชื่อพนักงานเมื่อเปิดหน้าต่างขึ้นมา
    useEffect(() => {
        if (isOpen && role === 'admin') {
            const fetchWallmen = async () => {
                try {
                    const res = await fetch('/api/profile');
                    if (res.ok) {
                        const data: Profile[] = await res.json();
                        setWallmen(data.filter(user => user.role === 'wallman'));
                    }
                } catch (err) {
                    console.error("Error fetching wallmen:", err);
                }
            };
            fetchWallmen();
        }
    }, [isOpen, role]);

    // เมื่อแอดมินเลือกชื่อพนักงาน ให้ดึงยอดหนี้ของคนนั้นมาโชว์
    useEffect(() => {
        if (selectedUserId) {
            const fetchDebt = async () => {
                try {
                    const res = await fetch(`/api/dashboard?userId=${selectedUserId}&role=wallman`);
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentDebt(Number(data.current_debt) || 0);
                    }
                } catch (err) {
                    console.error("Error fetching debt:", err);
                }
            };
            fetchDebt();
        } else {
            setCurrentDebt(null);
        }
    }, [selectedUserId]);

    const handlePayDebt = async () => {
        if (!selectedUserId) return alert("กรุณาเลือกพนักงาน");
        if (!payAmount || Number(payAmount) <= 0) return alert("กรุณากรอกจำนวนเงินที่ถูกต้อง");
        
        if (currentDebt !== null && Number(payAmount) > currentDebt) {
            if (!confirm("จำนวนเงินที่จ่ายมากกว่ายอดหนี้ค้างชำระ ยืนยันที่จะดำเนินการต่อหรือไม่?")) return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/profile/debt', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    payAmount: Number(payAmount)
                })
            });

            if (res.ok) {
                alert("ตัดยอดหนี้สำเร็จ!");
                setIsOpen(false);
                setSelectedUserId("");
                setPayAmount("");
                window.location.reload(); // รีเฟรชหน้าเพื่อให้สถิติ Dashboard อัปเดตทันที
            } else {
                const errData = await res.json();
                alert(`เกิดข้อผิดพลาด: ${errData.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsSubmitting(false);
        }
    };

    // หากไม่ใช่แอดมิน ไม่ต้องเรนเดอร์ Component นี้เลย
    if (role !== 'admin') return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-3 rounded-lg transition-colors bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-sm"
            >
                ชำระยอดค้าง
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-200 flex flex-col">
                    {/* Navbar */}
                    <div className="sticky top-0 z-50 bg-background shadow-sm border-b border-gray-200" style={{ height: "var(--navbar-height)" }}>
                        <div className="flex items-center gap-4 px-4 h-full">
                            <BackButton onClick={() => setIsOpen(false)} />
                            <h2 className="text-lg font-bold text-gray-800">จัดการยอดค้างชำระ</h2>
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto mt-4">
                        <div className="max-w-md mx-auto space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            
                            {/* เลือกพนักงาน */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">เลือกพนักงาน</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-black outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="" disabled>เลือกพนักงาน</option>
                                    {wallmen.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* แสดงยอดค้างชำระปัจจุบัน */}
                            {currentDebt !== null && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                                    <p className="text-sm text-red-600 font-medium mb-1">ยอดค้างชำระปัจจุบัน</p>
                                    <p className="text-3xl font-bold text-red-700">฿{currentDebt.toLocaleString()}</p>
                                </div>
                            )}

                            {/* กรอกจำนวนเงินที่นำมาชำระ */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">ยอดเงินที่นำมาชำระ</label>
                                <input
                                    type="number"
                                    placeholder="กรอกจำนวนเงิน"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white text-xl font-bold text-teal-600 outline-none focus:ring-2 focus:ring-teal-500 hide-arrows text-center"
                                />
                            </div>

                            <button
                                onClick={handlePayDebt}
                                disabled={isSubmitting || !selectedUserId || !payAmount}
                                className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors mt-2
                                    ${(isSubmitting || !selectedUserId || !payAmount) ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}
                                `}
                            >
                                {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการตัดยอดหนี้'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}