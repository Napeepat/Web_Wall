// app/components/history/editOrderModal.tsx
"use client";

import { useState, useEffect } from "react";
import BackButton from "@/app/components/allButton/backIsOpen";

// --- เพิ่ม Interfaces สำหรับแทนที่ any ---
interface Product {
    id: string;
    nameproduct: string;
    price: number;
    cost_per_box: number;
    statusproduct: string;
}

interface OrderItemInfo {
    product_id: string | number;
    quantity: number;
}

interface OrderInfo {
    id: string | number;
    profiles?: { name: string };
    order_items?: OrderItemInfo[];
}

interface EditOrderModalProps {
    order: OrderInfo;
    onClose: () => void;
    onSuccess: () => void;
}
// ------------------------------------

export default function EditOrderModal({ order, onClose, onSuccess }: EditOrderModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await fetch('/api/product');
            if (res.ok) setProducts(await res.json());
        };
        fetchProducts();

        // ดึงของเก่าจากบิลมาใส่ในตะกร้าอัตโนมัติ
        if (order && order.order_items) {
            const initialCart: { [key: string]: number } = {};
            order.order_items.forEach((item: OrderItemInfo) => {
                initialCart[item.product_id] = item.quantity;
            });
            setCart(initialCart);
        }
    }, [order]);

    const calculateTotal = () => {
        let total = 0;
        products.forEach(p => {
            const qty = cart[p.id] || 0;
            total += p.price * qty;
        });
        return total;
    };

    const setExactQuantity = (productId: string, value: number) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (isNaN(value) || value <= 0) delete newCart[productId];
            else newCart[productId] = value;
            return newCart;
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        const currentQty = cart[productId] || 0;
        setExactQuantity(productId, currentQty + delta);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        const orderItems = Object.keys(cart).map(productId => {
            const product = products.find(p => p.id == productId);
            return {
                product_id: parseInt(productId),
                quantity: cart[productId],
                price_at_sale: product?.price || 0,
                cost_at_sale: product?.cost_per_box || 0
            };
        });

        try {
            const res = await fetch('/api/order/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: order.id,
                    total_amount: calculateTotal(),
                    items: orderItems
                })
            });

            if (res.ok) {
                alert("บันทึกและยืนยันบิลเรียบร้อย!");
                onSuccess(); // รีเฟรชหน้าประวัติ
            } else {
                alert("เกิดข้อผิดพลาด");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-60 bg-background overflow-y-auto animate-in fade-in flex flex-col">
            <div className="sticky top-0 z-50 bg-background shadow-sm border-b border-gray-200" style={{ height: "var(--navbar-height)" }}>
                <div className="flex items-center justify-between gap-4 px-4 h-full">
                    <BackButton onClick={onClose} />
                    <div className="text-sm font-bold text-gray-800">
                        ยืนยันบิล: {order.profiles?.name}
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-blue-600">
                            {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 pb-24 overflow-y-auto">
                <div className="space-y-3 max-w-2xl mx-auto">
                    {products.map((product) => {
                        const qty = cart[product.id] || 0;
                        const isInactive = product.statusproduct === 'false';

                        return (
                            <div key={product.id} className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm ${isInactive ? 'opacity-50' : ''}`}>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800 text-sm md:text-base">{product.nameproduct}</h3>
                                    <p className="text-sm text-blue-600 font-medium">{product.price.toLocaleString()} บาท</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(product.id, -1)} disabled={qty === 0 || isInactive} className={`w-8 h-8 rounded-full text-xl pb-1 ${qty > 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>-</button>
                                    <input type="number" min="0" value={qty === 0 ? "" : qty} onChange={(e) => setExactQuantity(product.id, parseInt(e.target.value))} disabled={isInactive} className="w-12 h-8 text-center text-black font-bold border border-gray-200 rounded-md hide-arrows outline-none focus:ring-2 focus:ring-blue-500" />
                                    <button onClick={() => updateQuantity(product.id, 1)} disabled={isInactive} className={`w-8 h-8 rounded-full text-xl pb-1 ${isInactive ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-60">
                <button onClick={handleSave} disabled={isSubmitting || Object.keys(cart).length === 0} className="w-full max-w-2xl mx-auto py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 flex justify-center">
                    {isSubmitting ? 'กำลังบันทึก...' : `ยืนยันบิล (${Object.keys(cart).length} รายการ)`}
                </button>
            </div>
        </div>
    );
}