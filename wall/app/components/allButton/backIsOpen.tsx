import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void; // กำหนด Type ให้รู้ว่าเป็นฟังก์ชันที่ไม่มีการ return ค่า
}

export default function BackButton_({ onClick }: BackButtonProps) {
  return (
    <button // ปุ่มย้อนกลับ
      onClick={onClick}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
    >
      <ArrowLeft size={20} strokeWidth={2.5} />
      <span></span>
    </button>
  );
}