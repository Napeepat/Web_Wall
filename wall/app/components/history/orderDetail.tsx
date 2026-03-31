// app/components/history/orderDetail.tsx
"use client";

import { useState }         from "react";
import { OrderHistory }     from "./historyButton";
import { useAuth }          from "@/app/login/useAuth";
import EditOrderModal_      from "@/app/components/history/editOrderModal";


interface OrderDetailModalProps {
    order: OrderHistory;
    onClose: () => void;
    getStatusDisplay: (status: string) => { text: string; color: string };
    onRefresh?: () => void;                                                     // เพิ่ม props สำหรับรีเฟรชข้อมูลหลังแก้ไข
}

export default function OrderDetailModal({ order, onClose, getStatusDisplay, onRefresh }: OrderDetailModalProps) {
    const { role } = useAuth();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const statusObj = getStatusDisplay(order.status_order);
    const dateObj = new Date(order.order_date);

    // ฟังก์ชันจัดการสถานะบิล (ยกเลิก / ยืนยัน)
    const handleUpdateStatus = async (newStatus: 'cancelled' | 'confirmed' | 'completed') => {
        if (!confirm(`คุณแน่ใจที่จะเปลี่ยนสถานะเป็น: ${newStatus === 'cancelled' ? 'ยกเลิก' : 'ยืนยันบิล'}`)) return;
        
        setIsSubmitting(true);
        try {
            // ใช้ API edit เดิมแต่ส่งแค่สถานะไป (หรือสร้าง API status แยกก็ได้)
            const res = await fetch('/api/order/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: order.id,
                    total_amount: order.total_amount,
                    paid_amount: order.paid_amount,
                    status_order: newStatus,            // เปลี่ยนสถานะ
                    items: order.order_items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price_at_sale: item.price_at_sale,
                        cost_at_sale: 0 // ดึงจากข้อมูลเดิมถ้าจำเป็น
                    }))
                })
            });

            if (res.ok) {
                alert("ดำเนินการสำเร็จ");
                if (onRefresh) onRefresh();
                onClose();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isEditOpen) {
        return (
            <EditOrderModal_ 
                order={order} 
                onClose={() => setIsEditOpen(false)} 
                onSuccess={() => {
                    setIsEditOpen(false);
                    if (onRefresh) onRefresh();
                    onClose();
                }} 
            />
        );
    }

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 animate-in fade-in duration-200" 
                onClick={onClose} 
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">รายละเอียดการเบิก</h3>
                        <p className="text-xs text-gray-500">
                            {dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })} | {dateObj.toLocaleTimeString('th-TH')} น.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3">
                    
                    {/* สถานะบิล */}
                    <div className={`py-1.5 rounded-xl text-center font-bold text-sm ${statusObj.color}`}>
                        {statusObj.text}
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">ผู้เบิกสินค้า</span>
                        <span className="font-semibold text-gray-800">{order.profiles?.name}</span>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-700">รายการสินค้า</p>
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {order.order_items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <div className="flex gap-2">
                                        <span className="text-blue-600 font-bold">{item.quantity}x</span>
                                        <span className="text-gray-700">{item.product?.nameproduct}</span>
                                    </div>
                                    <span className="font-medium text-gray-800">฿{item.subtotal.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 space-y-2">
                        
                        {/* รวมเป็นเงิน */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">รวมเป็นเงิน</span>
                            <span className="text-lg font-bold text-blue-600">฿{order.total_amount.toLocaleString()}</span>
                        </div>
                        
                        {/* ชำระแล้ว */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">ชำระแล้ว</span>
                            <span className="font-bold text-emerald-600">฿{order.paid_amount.toLocaleString()}</span>
                        </div>

                        {/* ยอดค้าง */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">ยอดค้าง</span>
                            <span className="font-bold text-red-900">฿{(order.total_amount - order.paid_amount).toLocaleString()}</span>
                        </div>

                    </div>

                    {/* ปุ่มจัดการ (จะแสดงเฉพาะบิลที่ยังเป็น 'pending') */}
                    {order.status_order === 'pending' && (
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">

                            {/* ปุ่มยกเลิก - ใช้ได้ทั้งคู่ */}
                            <button 
                                disabled={isSubmitting}
                                onClick={() => handleUpdateStatus('cancelled')}
                                className="py-2.5 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                                ยกเลิกบิล
                            </button>

                            {/* ปุ่มแก้ไข - ใช้ได้ทั้งคู่  */}
                            <button 
                                onClick={() => setIsEditOpen(true)}
                                className="py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                แก้ไข
                            </button>

                            {/* ปุ่มยืนยัน - สำหรับ Admin */}
                            {role === 'admin' && (
                                <button 
                                    onClick={() => handleUpdateStatus('confirmed')}
                                    className="py-2.5 rounded-xl font-bold text-sm bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                >
                                    ยืนยันบิล
                                </button>
                            )}


                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}