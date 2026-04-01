// app/components/dashboard/dashboardStats.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/login/useAuth";

interface OrderItemType {
    quantity: number;
    cost_at_sale: number;
}

interface OrderType {
    id: string | number;
    order_date: string;
    total_amount: number;
    paid_amount: number;
    status_order: string;
    order_items?: OrderItemType[];
}

interface RestockItem {
    id: string | number;
    date: string;
    amount: number;
}

interface DashboardStatsData {
    // ข้อมูลที่ใช้ร่วมกัน หรือของ Wallman
    monthlySales: number;
    totalDebt: number;
    commission: number;
    restockHistory: RestockItem[];
    
    // ข้อมูลของ Admin
    totalDebtAll: number;
    dailySales: number;
    dailyProfit: number;
    monthlyProfit: number;
    netDailyProfit: number;
}

// สร้าง String เพื่อใช้เปรียบเทียบเวลาตรงๆ แบบ 'YYYY-MM-DD HH:mm:ss'
function getLocalTimeBounds() {
    const now = new Date();
    
    // ดึงส่วนประกอบของวันที่ปัจจุบันตามเวลาไทย
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    return {
        startOfDay: `${year}-${month}-${day} 00:00:00`, // จุดเริ่มต้นของวันนี้
        startOfMonth: `${year}-${month}-01 00:00:00`    // จุดเริ่มต้นของเดือนนี้
    };
}

export default function DashboardStats() {
    const { userProfile, role } = useAuth();
    const [stats, setStats] = useState<DashboardStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.id || !role) return;

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/dashboard?userId=${userProfile.id}&role=${role}`);
                if (res.ok) {
                    const { orders, current_debt, totalDebtAll } = await res.json();
                    const { startOfDay, startOfMonth } = getLocalTimeBounds();

                    // เตรียม Object สำหรับเก็บค่าสถิติ
                    const newStats: DashboardStatsData = {
                        monthlySales: 0,
                        totalDebt: Number(current_debt) || 0,     // ใช้หนี้จาก Data ตรงๆ เลย (ของ Wallman)
                        commission: 0,
                        restockHistory: [],
                        totalDebtAll: Number(totalDebtAll) || 0,  // ใช้หนี้รวมจาก Data ตรงๆ เลย (ของ Admin)
                        dailySales: 0,
                        dailyProfit: 0,
                        monthlyProfit: 0,
                        netDailyProfit: 0
                    };

                    if (role === 'wallman') {
                        orders?.forEach((o: OrderType) => {

                        const orderDateStr = o.order_date; // เวลาจาก API

                            if (orderDateStr >= startOfMonth) {
                                newStats.monthlySales += o.total_amount;
                                newStats.restockHistory.push({ 
                                    id: o.id, 
                                    date: orderDateStr, 
                                    amount: o.total_amount 
                                });
                            }
                        });
                        // ค่าคอม
                        newStats.commission = newStats.monthlySales * 0.06;
                    }

                    if (role === 'admin') {
                        let dailyCost = 0;
                        let monthlyCost = 0;

                        orders?.forEach((o: OrderType) => {

                        const orderDateStr = o.order_date;

                            const isThisMonth = orderDateStr >= startOfMonth;
                            const isToday = orderDateStr >= startOfDay;

                            // คำนวณต้นทุน
                            const cost = o.order_items?.reduce((sum: number, item: OrderItemType) => sum + (item.quantity * item.cost_at_sale), 0) || 0;

                            if (isThisMonth) {
                                newStats.monthlySales += o.total_amount;
                                monthlyCost += cost;
                            }
                            if (isToday) {
                                newStats.dailySales += o.total_amount;
                                dailyCost += cost;
                            }
                        });

                        newStats.dailyProfit = newStats.dailySales - dailyCost;
                        newStats.monthlyProfit = newStats.monthlySales - monthlyCost;
                        newStats.netDailyProfit = newStats.dailyProfit - 200; // หักค่าไฟ
                    }

                    setStats(newStats);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userProfile, role]);

    if (loading) return <div className="text-center p-4 text-gray-500 animate-pulse">กำลังโหลด</div>;
    if (!stats) return null;

    // --- มุมมอง Wallman ---
    if (role === 'wallman') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    {/* ยอดขายเดือนนี้ */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                        <div className="text-sm text-gray-500 mb-1">ยอดซื้อเดือนนี้</div>
                        <div className="text-xl font-bold text-blue-600">{stats.monthlySales.toLocaleString()}</div>
                    </div>

                    {/* ยอดค้างชำระ */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                        <div className="text-sm text-gray-500 mb-1">ยอดค้างชำระ</div>
                        <div className="text-xl font-bold text-red-600">{stats.totalDebt.toLocaleString()}</div>
                    </div>

                    {/* ค่าคอมโดยประมาณ */}
                    {    <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500 mb-1">ค่าคอมโดยประมาณ</div>
                            <div className="text-xl font-bold text-green-600">{stats.commission.toLocaleString()}</div>
                        </div> }

                    {/* จำนวนครั้งลงของเดือนนี้ */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                        <div className="text-sm text-gray-500 mb-1">ลงของเดือนนี้</div>
                        <div className="text-xl font-bold text-orange-600">{stats.restockHistory.length} ครั้ง</div>
                    </div>

                </div>

                {/* ตารางลงของเดือนนี้ */}
                

            </div>
        );
    }

    // --- มุมมอง Admin ---
    return (
        <div className="grid grid-cols-2 gap-4">

            {/* ยอดขายรายวัน */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm text-gray-500 mb-1">ยอดขายรายวัน</div>
                <div className="text-xl font-bold text-blue-600">{stats.dailySales.toLocaleString()}</div>
            </div>

            {/* ยอดขายรายเดือน */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                <div className="text-sm text-gray-500 mb-1">ยอดขายรายเดือน</div>
                <div className="text-xl font-bold text-indigo-600">{stats.monthlySales.toLocaleString()}</div>
            </div>


            
            {/* กำไรวันนี้ */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="text-sm text-gray-500 mb-1">กำไรวันนี้</div>
                <div className="text-xl font-bold text-green-500">{stats.dailyProfit.toLocaleString()}</div>
            </div>
            
            {/* กำไรเดือนนี้ */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                <div className="text-sm text-gray-500 mb-1">กำไรเดือนนี้</div>
                <div className="text-xl font-bold text-emerald-600">{stats.monthlyProfit.toLocaleString()}</div>
            </div>

            {/* ยอดค้างของทุกคนรวม */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 col-span-2 md:col-span-1">
                <div className="text-sm text-gray-500 mb-1">ยอดค้างของทุกคนรวม</div>
                <div className="text-2xl font-bold text-red-600">{stats.totalDebtAll.toLocaleString()}</div>
            </div>

            {/* กำไรสุทธิวันนี้ */}
            <div className="bg-linear-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-sm text-white col-span-2 md:col-span-1">
                <div className="text-sm text-green-100 mb-1">กำไรสุทธิวันนี้ (หักค่าไฟ 200)</div>
                <div className="text-2xl font-bold">
                    {stats.netDailyProfit > 0 ? stats.netDailyProfit.toLocaleString() : '0'} 
                    <span className="text-sm font-normal ml-2 opacity-80 text-white">
                        {stats.netDailyProfit < 0 && `(ขาดทุน ${Math.abs(stats.netDailyProfit).toLocaleString()})`}
                    </span>
                </div>
            </div>
        </div>
    );
}