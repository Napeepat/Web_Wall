// app/components/logo.tsx
"use client";

import { useAuth } from "@/app/login/useAuth";

export default function Button_Logo_({ className = "" }) {
    const { role } = useAuth();

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div 
            onClick={handleRefresh}
            className={`font-bold text-2xl text-blue-800 tracking-tight cursor-pointer select-none ${className}`}
        >
            {role === 'wallman' && <> Wall<span className="text-orange-500">Man</span> </>}
            {role === 'admin' && <> Ad<span className="text-orange-500">min</span> </>}
            {!role && <> Wall<span className="text-orange-500">App</span> </>}
        </div>
    )
}