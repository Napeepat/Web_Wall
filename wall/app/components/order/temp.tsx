// app/components/order/orderButton.tsx
"use client";

import { useAuth }              from "@/app/login/useAuth";
import { useState, useEffect }  from "react";
import BackButton               from "@/app/components/allButton/backIsOpen";

export interface Product {
  id: string;
  nameproduct: string;
  statusproduct: 'true' | 'false';
  price: number;
  category: 'STK' | 'CON' | 'CUP' | 'SCP' | 'PRM';
  cost_per_box: number;
}

export interface Profile {
  id: string;
  name: string;
  role: string;
}

export default function OrderButton_() {

    const { userProfile, role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [wallmen, setWallmen] = useState<Profile[]>([]);

    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    
    // State สำหรับเวลารับของ
    const [pickupTime, setPickupTime] = useState<string>(""); 

    useEffect(() => {
        if (!isOpen) return;

        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/product');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (err) {
                console.error("Error fetching products:", err);
            }
        };

        const fetchWallmen = async () => {
            if (role !== 'admin') return;
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

        fetchProducts();
        fetchWallmen();
    }, [isOpen, role, userProfile]);

    const calculateTotal = () => {
        let total = 0;
        products.forEach(p => {
            const qty = cart[p.id] || 0;
            total += p.price * qty;
        });
        return total;
    };

    // ฟังก์ชันพิมพ์ตัวเลขจำนวนสินค้าโดยตรง
    const setExactQuantity = (productId: string, value: number) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (isNaN(value) || value <= 0) {
                delete newCart[productId]; // ถ้าเป็น 0 ให้ลบออกจากตะกร้า
            } else {
                newCart[productId] = value;
            }
            return newCart;
        });
    };

    // ฟังก์ชันปุ่มกด + และ -
    const updateQuantity = (productId: string, delta: number) => {
        const currentQty = cart[productId] || 0;
        setExactQuantity(productId, currentQty + delta);
    };

    // ฟังก์ชันส่งข้อมูลบิลไปที่ API
    const handleSubmitOrder = async () => {
        if (Object.keys(cart).length === 0) return alert("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
        
        const finalUserId = role === 'admin' ? selectedUserId : userProfile?.id;
        if (!finalUserId) return alert("กรุณาระบุผู้รับบิล");

        const orderItems = Object.keys(cart).map(productId => {
            const product = products.find(p => p.id === productId);
            return {
                product_id: productId,
                quantity: cart[productId],
                price_at_sale: product?.price || 0,
                cost_at_sale: product?.cost_per_box || 0
            };
        });

        const payload = {
            wallman_id: finalUserId,
            total_amount: calculateTotal(),
            pickup_time: pickupTime, 
            items: orderItems
        };

        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("เปิดบิลสำเร็จ! รอการยืนยันจากแอดมิน");
                setIsOpen(false);
                setCart({});
                setPickupTime("");
                // TODO: ทริกเกอร์แจ้งเตือนตรงนี้ในอนาคต
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึกบิล");
            }
        } catch (err) {
            console.error(err);
        }
    };
    
    return (
        <>
            <button         
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 rounded-lg transition-colors bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-sm"
            >
                เปิดบิลสินค้า
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-200 flex flex-col">
                    
                    {/*Navbar*/}
                    <div className="sticky top-0 z-50 bg-background shadow-sm border-b border-gray-200" style={{ height: "var(--navbar-height)" }} >
                        <div className="flex items-center justify-between gap-4 px-4 h-full">

                            <BackButton onClick={() => setIsOpen(false)} />

                            {/*ส่วนเลือกผู้ใช้*/}
                            <div className="flex items-center border border-gray-200 bg-gray-200 rounded-lg px-3 py-1.5 shadow-inner">
                                <label className="text-sm text-black mr-1">ชื่อ:</label>

                                {role === 'admin' ? (
                                    <select 
                                        className="bg-gray-200 text-black text-sm outline-none cursor-pointer max-w-35 sm:max-w-xs truncate"
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                    >
                                        <option value="" disabled> เลือกพนักงาน </option>
                                        {wallmen.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className=" text-black text-sm">{userProfile?.name}</span>
                                )}
                            </div>
                            
                            {/*ราคารวม*/}
                            <div className="flex-1 text-right">
                                <span className="text-sm text-gray-500 block leading-tight">ราคารวม</span>
                                <span className="text-xl font-bold text-blue-600 leading-tight">
                                    {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* ส่วนเลือกเวลารับของ */}
                    <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-40">
                        <label className="text-sm font-bold text-gray-700">เวลารับของ (ไม่ระบุก็ได้):</label>
                        <input 
                            type="time" 
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="border border-gray-300 rounded-lg p-1.5 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                        />
                    </div>

                    {/*กรอกสินค้า*/}
                    <div className="flex-1 p-4 pb-24 overflow-y-auto">
                        <div className="space-y-3 max-w-2xl mx-auto">
                            {products.map((product) => {
                                const qty = cart[product.id] || 0;
                                const isInactive = product.statusproduct === 'false';

                                return (
                                    <div key={product.id} className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm ${isInactive ? 'opacity-50 bg-gray-50' : ''}`}>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800 text-sm md:text-base">{product.nameproduct}</h3>
                                            <p className="text-sm text-blue-600 font-medium">{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* ปุ่มลบ */}
                                            <button 
                                                onClick={() => updateQuantity(product.id, -1)}
                                                disabled={qty === 0 || isInactive}
                                                className={`w-8 h-8 flex items-center justify-center rounded-full text-xl pb-1 
                                                    ${qty > 0 ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-gray-100 text-gray-400'}`}
                                            >
                                                -
                                            </button>
                                            
                                            {/* ช่องกรอกตัวเลข */}
                                            <input 
                                                type="number"
                                                min="0"
                                                value={qty === 0 ? "" : qty}
                                                onChange={(e) => setExactQuantity(product.id, parseInt(e.target.value))}
                                                disabled={isInactive}
                                                placeholder="0"
                                                className="w-12 h-8 text-center text-black font-bold border border-gray-200 rounded-md hide-arrows focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                                            />
                                            
                                            {/* ปุ่มบวก */}
                                            <button 
                                                onClick={() => updateQuantity(product.id, 1)}
                                                disabled={isInactive}
                                                className={`w-8 h-8 flex items-center justify-center rounded-full text-xl pb-1
                                                    ${isInactive ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer: ปุ่มยืนยัน ติดขอบล่าง */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                        <div className="max-w-2xl mx-auto">
                            <button 
                                onClick={handleSubmitOrder}
                                disabled={Object.keys(cart).length === 0}
                                className={`w-full py-3 rounded-lg font-bold text-white transition-colors
                                    ${Object.keys(cart).length > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300 cursor-not-allowed'}
                                `}
                            >
                                ยืนยันเปิดบิล ({Object.keys(cart).length} รายการ)
                            </button>
                        </div>
                    </div>
                    
                </div>
            )}
        </>
    )
}