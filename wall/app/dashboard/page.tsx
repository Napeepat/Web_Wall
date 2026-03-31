// app/dashboard/page.tsx
"use client";
import { useAuth }      from "@/app/login/useAuth";

import CheckProductPrices_  from "@/app/components/checkProductButton"

import OrderButton_         from "@/app/components/order/orderButton";
//import OrderButton_         from "@/app/components/order/temp";

import HistoryButton_ from "@/app/components/history/historyButton";
//import HistoryButton_ from "@/app/components/history/temp";
import DashboardStats from "@/app/components/dashboard/dashboardStats";



export default function DashboardPage() {

    const { role } = useAuth();
    
    return (
      <div className="w-full bg-[url('/background.png')] bg-cover bg-center bg-fixed min-h-screen py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          {role === 'admin' && <></>}

          <DashboardStats />
          <CheckProductPrices_ />

          <OrderButton_ />

          <HistoryButton_ />


        </div>
      </div>
    );
}