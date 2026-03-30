// 
"use client";

export default function Components_menu() {
  return (
    <div className="relative">
      <button>
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="black"
          stroke="currentColor" //สีของขอบ
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
    </div>
  );
}
