// app/dashboard/page.tsx
"use client";
import { useAuth }      from "@/app/login/useAuth";

import CheckProductPrices_  from "@/app/components/checkProductButton"

import OrderButton_         from "@/app/components/order/orderButton";

import HistoryButton_       from "@/app/components/history/historyButton";
import DashboardStats       from "@/app/components/dashboard/dashboardStats";
import AdminWallmanStats    from "@/app/components/dashboard/adminWallmanStats";
import PayDebtButton        from "@/app/components/dashboard/payDebtButton";



export default function DashboardPage() {

    const { role } = useAuth();
    
    return (
      <div className="w-full bg-background py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          {role === 'admin' && <></>}

          <DashboardStats />
          <CheckProductPrices_ />

          <OrderButton_ />

          <HistoryButton_ />

          {role === 'admin' && <PayDebtButton />}
          {role === 'admin' && <AdminWallmanStats />}


        </div>
      </div>
    );
}