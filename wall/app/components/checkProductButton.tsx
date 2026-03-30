// app/components/checkProductPrices.tsx
"use client";

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

export default function CheckProductPrices_(){

    const [isOpen, setIsOpen] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/product');

                if (!response.ok) {
                    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
                }
                const data: Product[] = await response.json();
                //console.log("Fetched products:", data);
                console.log("Fetched products:", data);
                setProducts(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        };
        fetchProducts();
    }, [isOpen]);


    if ( error ) {
        return <div className="p-4 text-center text-red-500">{error}</div>; //fix
    }
    

    return (
        <>
            <button         
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
                ตรวจสอบสินค้า
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-200">
                    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        
                            <BackButton onClick={() => setIsOpen(false)} />

                            <h2 className="text-xl font-bold text-blue-800"> สินค้า </h2>
                        </div>

                        {/* ตารางแสดงข้อมูลสินค้า */}
                        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
                            <table className="min-w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-50 text-blue-900 text-sm">
                                        <th className="p-3 border-b border-gray-200">ชื่อสินค้า</th>
                                        <th className="p-3 border-b border-gray-200 text-right">ราคา</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {products.map((product, index) => {
                                    // เช็คว่าหมวดหมู่ของแถวนี้ ต่างจากแถวก่อนหน้าหรือไม่
                                    const isNewCategory = index > 0 && product.category !== products[index - 1].category;
                                    
                                    const isInactive = product.statusproduct === 'false';

                                    return (
                                    <tr 
                                        key={product.id} 
                                        className={`
                                        border-b border-gray-100 hover:bg-gray-50 text-gray-800 text-sm
                                        ${isNewCategory ? "border-t-40 border-t-white" : ""} {/* ใช้ border-t-xx (ขอบบนหนา) เพื่อสร้างระยะห่างระหว่างหมวดหมู่ */}
                                        ${isInactive ? "text-red-500 bg-red-50/30" : "text-gray-800"}
                                        `}
                                    >
                                        <td className={`p-3 ${isNewCategory ? "pt-6" : ""} `}>
                                            {product.nameproduct}
                                            
                                            
                                            {isInactive && ( //สถานะเป็น false หมด ต่อท้าย
                                                <span className="ml-2  text-red-500">
                                                (หมด)
                                                </span>
                                            )}
                                        </td>

                                        <td className={`p-3 text-right ${isNewCategory ? "pt-6" : ""}`}>
                                        {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    
                    </div>
                    
                </div>
            )}
        </>
    )

}