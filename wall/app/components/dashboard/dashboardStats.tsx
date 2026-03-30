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

// ฟังก์ชันหาเวลาเที่ยงคืนและวันที่ 1 ของเดือน ตามเวลาประเทศไทย
function getThaiTimeBounds() {
    const now = new Date();
    
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const [{ value: month }, , { value: day }, , { value: year }] = formatter.formatToParts(now);
    
    const startOfDayThai = new Date(`${year}-${month}-${day}T00:00:00+07:00`);
    const startOfMonthThai = new Date(`${year}-${month}-01T00:00:00+07:00`);
    
    return {
        startOfDayUTC: startOfDayThai.toISOString(),
        startOfMonthUTC: startOfMonthThai.toISOString()
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
                    const { orders } = await res.json();
                    const { startOfDayUTC, startOfMonthUTC } = getThaiTimeBounds();

                    // เตรียม Object สำหรับเก็บค่าสถิติ
                    const newStats: DashboardStatsData = {
                        monthlySales: 0,
                        totalDebt: 0,
                        commission: 0,
                        restockHistory: [],
                        totalDebtAll: 0,
                        dailySales: 0,
                        dailyProfit: 0,
                        monthlyProfit: 0,
                        netDailyProfit: 0
                    };

                    if (role === 'wallman') {
                        orders?.forEach((o: OrderType) => {
                            const unpaid = o.total_amount - o.paid_amount;
                            if (unpaid > 0) newStats.totalDebt += unpaid;

                            // เติม Z ให้วันที่เพื่อป้องกันความผิดพลาดจาก Timezone
                            const orderDateUTC = o.order_date.endsWith('Z') ? o.order_date : o.order_date + 'Z';
                            const orderDateObj = new Date(orderDateUTC).toISOString();

                            if (orderDateObj >= startOfMonthUTC) {
                                newStats.monthlySales += o.total_amount;
                                newStats.restockHistory.push({ 
                                    id: o.id, 
                                    date: orderDateUTC, 
                                    amount: o.total_amount 
                                });
                            }
                        });
                        newStats.commission = newStats.monthlySales * 0.10;
                    }

                    if (role === 'admin') {
                        let dailyCost = 0;
                        let monthlyCost = 0;

                        orders?.forEach((o: OrderType) => {
                            const unpaid = o.total_amount - o.paid_amount;
                            if (unpaid > 0) newStats.totalDebtAll += unpaid;

                            // เติม Z ให้วันที่
                            const orderDateUTC = o.order_date.endsWith('Z') ? o.order_date : o.order_date + 'Z';
                            const orderDateObj = new Date(orderDateUTC).toISOString();

                            const isThisMonth = orderDateObj >= startOfMonthUTC;
                            const isToday = orderDateObj >= startOfDayUTC;

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

    if (loading) return <div className="text-center p-4 text-gray-500 animate-pulse">กำลังโหลดสถิติ...</div>;
    if (!stats) return null;

    // --- มุมมอง Wallman ---
    if (role === 'wallman') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                        <div className="text-sm text-gray-500 mb-1">ยอดขายเดือนนี้</div>
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
                        <div className="text-xl font-bold text-orange-600">{stats.restockHistory.length} ครั้ง</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                        ตารางลงของเดือนนี้
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white border-b border-gray-100 text-gray-500">
                                <tr>
                                    <th className="px-4 py-2 font-medium">วันที่</th>
                                    <th className="px-4 py-2 font-medium text-right">ยอดเบิก (บาท)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.restockHistory.length === 0 ? (
                                    <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-400">ยังไม่มีการลงของในเดือนนี้</td></tr>
                                ) : (
                                    stats.restockHistory.map((item: RestockItem) => (
                                        <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-700">
                                                {new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- มุมมอง Admin ---
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 col-span-2 md:col-span-1">
                <div className="text-sm text-gray-500 mb-1">ยอดค้างของทุกคนรวม</div>
                <div className="text-2xl font-bold text-red-600">{stats.totalDebtAll.toLocaleString()}</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm text-gray-500 mb-1">ยอดขายรายวัน (วันนี้)</div>
                <div className="text-xl font-bold text-blue-600">{stats.dailySales.toLocaleString()}</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                <div className="text-sm text-gray-500 mb-1">ยอดขายรายเดือน</div>
                <div className="text-xl font-bold text-indigo-600">{stats.monthlySales.toLocaleString()}</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="text-sm text-gray-500 mb-1">กำไรวันนี้ (ยังไม่หักค่าไฟ)</div>
                <div className="text-xl font-bold text-green-500">{stats.dailyProfit.toLocaleString()}</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                <div className="text-sm text-gray-500 mb-1">กำไรเดือนนี้</div>
                <div className="text-xl font-bold text-emerald-600">{stats.monthlyProfit.toLocaleString()}</div>
            </div>

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