// app/page.tsx
"use client";

import LoginPage from "@/app/login/LoginForm";

export default function Home() {
  return (
    <div className="w-full bg-[url('/background.png')] py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">

        <LoginPage />
        
      </div>
    </div>
  )
}