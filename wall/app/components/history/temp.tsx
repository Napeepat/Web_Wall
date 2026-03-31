// app/components/history/historyButton.tsx
"use client";

import { useAuth } from "@/app/login/useAuth";
import { useState, useEffect, useCallback } from "react";
import BackButton from "@/app/components/allButton/backIsOpen";
import OrderDetailModal from "./orderDetail";

interface OrderItem {
    product_id: string | number;
    quantity: number;
    price_at_sale: number;
    subtotal: number;
    product: { nameproduct: string };
}

export interface OrderHistory {
    id: string;
    order_date: string;
    pickup_time: string | null;
    total_amount: number;
    paid_amount: number;
    status_order: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    profiles: { name: string };
    order_items: OrderItem[];
}

// 1. เพิ่ม Interface สำหรับข้อมูล Profile
interface Profile {
    id: string;
    name: string;
    role: string;
}

export default function HistoryButton_() {
    const { userProfile, role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);                    
    const [isOpenForFilter, setIsOpenForFilter] = useState(false);
    const [history, setHistory] = useState<OrderHistory[]>([]);     
    const [loading, setLoading] = useState(false);

    // 2. เพิ่ม State สำหรับเก็บข้อมูลพนักงานและค่า Filter
    const [wallmen, setWallmen] = useState<Profile[]>([]);
    const [selectedWallmanName, setSelectedWallmanName] = useState<string>(""); 

    const [selectedDetail, setSelectedDetail] = useState<OrderHistory | null>(null);
    
    const fetchHistory = useCallback(async () => {
        if (!userProfile?.id || !role) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/history?userId=${userProfile.id}&role=${role}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    }, [userProfile?.id, role]);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();

            // 3. ดึงรายชื่อ Wallman สำหรับ Admin เพื่อนำมาแสดงใน Dropdown
            if (role === 'admin') {
                const fetchWallmen = async () => {
                    try {
                        const res = await fetch('/api/profile');
                        if (res.ok) {
                            const data: Profile[] = await res.json();
                            const onlyWallmen = data.filter(user => user.role === 'wallman');
                            setWallmen(onlyWallmen);
                        }
                    } catch (err) {
                        console.error("Error fetching profiles:", err);
                    }
                };
                fetchWallmen();
            }
        }
    }, [isOpen, fetchHistory, role]);

    const getStatusDisplay = (status: string) => { 
        switch (status) {
            case 'pending': return { 
                text: 'รอยืนยัน', 
                color: 'text-orange-600 bg-orange-100',
                cardBg: 'bg-orange-50 border-orange-100 hover:border-orange-300 hover:shadow-orange-100' 
            };
            case 'confirmed': return { 
                text: 'ยืนยันแล้ว', 
                color: 'text-blue-600 bg-blue-100',
                cardBg: 'bg-blue-50 border-blue-100 hover:border-blue-300 hover:shadow-blue-100' 
            };
            case 'completed': return { 
                text: 'เสร็จสิ้น', 
                color: 'text-emerald-600 bg-emerald-100',
                cardBg: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100' 
            };
            case 'cancelled': return { 
                text: 'ยกเลิก', 
                color: 'text-rose-600 bg-rose-100',
                cardBg: 'bg-rose-50 border-rose-100 hover:border-rose-300 hover:shadow-rose-100' 
            };
            default: return { 
                text: status, 
                color: 'text-gray-600 bg-gray-100',
                cardBg: 'bg-gray-50 border-gray-100 hover:border-gray-300' 
            };
        }
    };

    // 4. กรองข้อมูล history ตามพนักงานที่เลือก (ถ้าค่าว่างคือแสดงทั้งหมด)
    const filteredHistory = selectedWallmanName 
        ? history.filter(order => order.profiles?.name === selectedWallmanName)
        : history;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-3 rounded-lg transition-colors bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
            >
                ประวัติการเบิกสินค้า
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-200 flex flex-col">
                    
                    {/* Navbar */}
                    <div className="sticky top-0 z-50 bg-background shadow-sm " style={{ height: "var(--navbar-height)" }} >
                        <div className="flex items-center gap-4 px-4 h-full relative">
                            <BackButton onClick={() => setIsOpen(false)} />
                            <h2 className="text-lg font-bold text-gray-800">
                                ประวัติย้อนหลัง {selectedWallmanName && <span className="text-blue-600 text-sm">({selectedWallmanName})</span>}
                            </h2>
                        
                            {/* filter กรองข้อมูล สำหรับแอดมิน  */}
                            {role === 'admin' && (
                                <div className="flex-1 text-right">
                                    <button
                                        onClick={() => setIsOpenForFilter(!isOpenForFilter)}
                                        className={`p-1.5 rounded-lg transition-colors ${selectedWallmanName ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 inline-block transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6a1 1 0 00-.293.707V19l-4-4v-.293a1 1 0 00-.293-.707l-6.414-6A1 1 0 013 6.586V4z" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                        </div>
                        
                    </div>

                    {/* รายการประวัติ */}
                    <div className="flex-1 p-4 pb-10 overflow-y-auto">
                        {loading ? (
                            <div className="text-center text-gray-500 mt-10">กำลังโหลดข้อมูล...</div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">
                                {history.length === 0 ? "ไม่มีประวัติการทำรายการ" : "ไม่พบประวัติของพนักงานที่เลือก"}
                            </div>
                        ) : ( 

                            // ใช้ filteredHistory ในการแสดงผลแทน history เดิม
                            <div className="space-y-1 max-w-3xl mx-auto">
                                {filteredHistory.map((order) => {
                                    const statusObj = getStatusDisplay(order.status_order);
                                    const dateObj = new Date(order.order_date);

                                    return (
                                        <div key={order.id} 
                                            onClick={() => setSelectedDetail(order)}
                                            className={`group p-5 rounded-lg border shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer    ${statusObj.cardBg}`}
                                        >
                                            <div className="group p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row justify-between gap-5">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {order.profiles?.name || 'ลูกค้าทั่วไป'}
                                                        </h3>
                                                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${statusObj.color}`}>
                                                            {statusObj.text}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>{dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>{dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                                        </div>
                                                    </div>

                                                    {order.pickup_time && (
                                                        <div className="inline-flex items-center gap-1.5 w-fit px-3 py-1.5 bg-blue-50/80 border border-blue-100 text-blue-700 rounded-lg text-sm font-medium mt-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                            </svg>
                                                            เวลารับของ: {order.pickup_time.substring(0,5)} น.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:items-end justify-center gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs text-gray-500 mb-0.5 font-medium">ยอดรวมสุทธิ</p>
                                                        <div className="text-2xl font-bold text-gray-900 tracking-tight">
                                                            ฿{order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:justify-end gap-2">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-100">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            ชำระแล้ว ฿{order.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                        
                                                        {(order.total_amount - order.paid_amount) > 0 && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md text-xs font-medium border border-rose-100">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                ค้างชำระ ฿{(order.total_amount - order.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {selectedDetail && ( <OrderDetailModal 
                order={selectedDetail} 
                onClose={() => setSelectedDetail(null)} 
                getStatusDisplay={getStatusDisplay}
                onRefresh={fetchHistory}/>
            )}

            {/* 5. Dropdown Filter UI */}
            {isOpenForFilter && (
                <>
                    <div 
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setIsOpenForFilter(false)}  
                    />
                    <div className="absolute top-14 right-4 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 border-b border-gray-50 text-xs font-semibold text-gray-500">
                            กรองตามพนักงาน
                        </div>
                        
                        {/* ปุ่มแสดงทั้งหมด */}
                        <button
                            onClick={() => { setSelectedWallmanName(""); setIsOpenForFilter(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedWallmanName === "" ? "text-blue-600 font-bold bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                            แสดงทั้งหมด
                        </button>

                        {/* รายชื่อพนักงาน */}
                        {wallmen.map(w => (
                            <button
                                key={w.id}
                                onClick={() => { setSelectedWallmanName(w.name); setIsOpenForFilter(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedWallmanName === w.name ? "text-blue-600 font-bold bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                {w.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}