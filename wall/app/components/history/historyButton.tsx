// app/components/history/historyButton.tsx
"use client";

import { useAuth } from "@/app/login/useAuth";
import { useState, useEffect } from "react";
import BackButton from "@/app/components/allButton/backIsOpen";
import EditOrderModal from "@/app/components/history/editOrderModal";

interface OrderItem {
    product_id: string | number;
    quantity: number;
    price_at_sale: number;
    subtotal: number;
    product: { nameproduct: string };
}

interface OrderHistory {
    id: string;
    order_date: string;
    pickup_time: string | null;
    total_amount: number;
    paid_amount: number;
    status_order: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    profiles: { name: string };
    order_items: OrderItem[];
}

export default function HistoryButton_() {
    const { userProfile, role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<OrderHistory[]>([]);
    const [loading, setLoading] = useState(false);

    const [editingOrder, setEditingOrder] = useState<OrderHistory | null>(null); 
    
    const fetchHistory = async () => {
        if (!userProfile?.id || !role) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/history?userId=${userProfile.id}&role=${role}`);
            if (res.ok) setHistory(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null); // เก็บ state ว่าบิลไหนกำลังกดดูรายละเอียดสินค้าอยู่

    useEffect(() => {
        if (!isOpen || !userProfile?.id || !role) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // ส่ง userId และ role ไปที่ API
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
        };

        fetchHistory();
    }, [isOpen, userProfile, role]);

    
    const getStatusDisplay = (status: string) => { // แปลงสถานะเป็นภาษาไทยและสี
        switch (status) {
            case 'pending': return { text: 'รอยืนยัน', color: 'text-orange-600 bg-orange-100' };
            case 'confirmed': return { text: 'ยืนยันแล้ว', color: 'text-blue-600 bg-blue-100' };
            case 'completed': return { text: 'เสร็จสิ้น', color: 'text-green-600 bg-green-100' };
            case 'cancelled': return { text: 'ยกเลิก', color: 'text-red-600 bg-red-100' };
            default: return { text: status, color: 'text-gray-600 bg-gray-100' };
        }
    };

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
                    <div className="sticky top-0 z-50 bg-background shadow-sm border-b border-gray-200" style={{ height: "var(--navbar-height)" }}>
                        <div className="flex items-center gap-4 px-4 h-full">
                            <BackButton onClick={() => setIsOpen(false)} />
                            <h2 className="text-lg font-bold text-gray-800">ประวัติย้อนหลัง</h2>
                        </div>

                        {/* filter กรองข้อมูล สำหรับแอดมิน  */}
                        
                    </div>

                    {/* รายการประวัติ */}
                    <div className="flex-1 p-4 pb-10 overflow-y-auto">
                        {loading ? (
                            <div className="text-center text-gray-500 mt-10">กำลังโหลดข้อมูล...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">ไม่มีประวัติการทำรายการ</div>
                        ) : ( 

                            // แสดงรายการประวัติการเบิกสินค้า
                            <div className="space-y-1 max-w-3xl mx-auto">
                                {history.map((order) => {
                                    const statusObj = getStatusDisplay(order.status_order);
                                    const dateObj = new Date(order.order_date);
                                    const isExpanded = expandedOrderId === order.id;

                                    return (
                                        <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                            {/* หัวบิล (คลิกเพื่อดูรายละเอียดได้) */}
                                            <div 
                                                className="p-4 cursor-pointer hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-800">
                                                            {dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                        </span>
                                                    </div>
                                                    
                                                    {/* แสดงชื่อ */}
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-semibold">{order.profiles?.name}</span>
                                                    </div>

                                                    {/* แสดงเวลารับของ */}
                                                    {order.pickup_time && (
                                                        <div className="text-sm text-blue-600">เวลารับของ: {order.pickup_time.substring(0,5)} น.</div>
                                                    )}
                                                </div>

                                                {/* แสดงยอด */}
                                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                                                    
                                                    <div className="flex flex-col items-end font-bold text-gray-800">
                                                        <span className="text-lg">
                                                            {order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 border border-emerald-100">
                                                            ชำระแล้ว ฿{order.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>

                                                    {/* แสดงสถานะ */}
                                                    <div className={`px-2 py-1 rounded text-xs font-bold ${statusObj.color}`}>
                                                        {statusObj.text}
                                                    </div>
                                                    
                                                </div>
                                            </div>

                                            {/* รายละเอียดสินค้า*/}
                                            {isExpanded && (
                                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                                    <div className="text-sm font-bold text-gray-700 mb-2">รายการสินค้า:</div>
                                                    <div className="space-y-2">
                                                        {order.order_items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm text-gray-600">
                                                                <div>
                                                                    <span>{item.quantity} x </span>
                                                                    <span>{item.product?.nameproduct}</span>
                                                                </div>
                                                                <div>฿{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* --- โค้ดปุ่มแก้ไข --- */}
                                                    {role === 'admin' && order.status_order === 'pending' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // กันไม่ให้บัตรหุบกลับ
                                                                setEditingOrder(order);
                                                            }}
                                                            className="mt-4 w-full py-2 bg-green-500 hover:bg-green-600 transition-colors text-white rounded-lg text-sm font-bold"
                                                        >
                                                            ตรวจเช็คและยืนยันบิล
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* เรียกใช้ Modal แก้ไขเมื่อมีการกดปุ่ม */}
            {editingOrder && (
                <EditOrderModal 
                    order={editingOrder} 
                    onClose={() => setEditingOrder(null)} 
                    onSuccess={() => {
                        setEditingOrder(null);
                        fetchHistory(); // อัปเดตข้อมูลประวัติใหม่
                    }}
                />
            )}
        </>
    );
}