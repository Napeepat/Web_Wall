// app/components/dashboard/adminWallmanStats.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/login/useAuth";

interface Profile {
    id: string;
    name: string;
    role: string;
}

interface WallmanStats {
    monthlySales: number;
    totalDebt: number;
    commission: number;
    restockCount: number;
}
interface Order {
    order_date: string;
    total_amount: number;
}

export default function AdminWallmanStats() {
    const { role } = useAuth();
    const [wallmen, setWallmen] = useState<Profile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [stats, setStats] = useState<WallmanStats | null>(null);
    const [loading, setLoading] = useState(false);

    // ดึงรายชื่อพนักงานทั้งหมด (เฉพาะที่เป็น wallman)
    useEffect(() => {
        if (role !== 'admin') return;
        
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
    }, [role]);

    // ดึงข้อมูลสถิติเมื่อมีการเปลี่ยนพนักงานที่เลือก
    useEffect(() => {
        if (!selectedUserId) {
            setStats(null);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            try {
                // เรียกใช้ API เดิม โดยส่ง userId ของคนที่เลือกและตั้งค่า role เป็น wallman เพื่อให้ API คำนวณข้อมูลให้
                const res = await fetch(`/api/dashboard?userId=${selectedUserId}&role=wallman`);
                if (res.ok) {
                    const { orders, current_debt } = await res.json() as {
                        orders: Order[], 
                        current_debt: string | number 
                    };
                    
                    // คำนวณช่วงเวลาของเดือนนี้
                    const now = new Date();
                    const formatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    const parts = formatter.formatToParts(now);
                    const year = parts.find(p => p.type === 'year')?.value;
                    const month = parts.find(p => p.type === 'month')?.value;
                    const startOfMonth = `${year}-${month}-01 00:00:00`;

                    let monthlySales = 0;
                    let restockCount = 0;

                    orders?.forEach((o) => {
                        if (o.order_date >= startOfMonth) {
                            monthlySales += o.total_amount;
                            restockCount += 1; // นับจำนวนครั้งที่ลงของ
                        }
                    });

                    setStats({
                        monthlySales,
                        totalDebt: Number(current_debt) || 0,
                        commission: monthlySales * 0.06, // คำนวณค่าคอม 6%
                        restockCount
                    });
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStats();
    }, [selectedUserId]);

    // ถ้าไม่ใช่แอดมินไม่ต้องแสดง Component นี้
    if (role !== 'admin') return null;

    return (
        <div className="mt-8 space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                ดูข้อมูลรายบุคคล
            </h3>
            
            <div className="relative">
                <select 
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="" disabled>-- เลือกพนักงานขาย --</option>
                    {wallmen.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="text-center py-6 text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>
            )}

            {!loading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 animate-in fade-in duration-300">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                        <div className="text-sm text-gray-500 mb-1">ยอดซื้อเดือนนี้</div>
                        <div className="text-xl font-bold text-blue-600">{stats.monthlySales.toLocaleString()}</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                        <div className="text-sm text-gray-500 mb-1">ยอดค้างชำระ</div>
                        <div className="text-xl font-bold text-red-600">{stats.totalDebt.toLocaleString()}</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                        <div className="text-sm text-gray-500 mb-1">ค่าคอมโดยประมาณ</div>
                        <div className="text-xl font-bold text-green-600">{stats.commission.toLocaleString()}</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                        <div className="text-sm text-gray-500 mb-1">ลงของเดือนนี้</div>
                        <div className="text-xl font-bold text-orange-600">{stats.restockCount} ครั้ง</div>
                    </div>
                </div>
            )}
        </div>
    );
}