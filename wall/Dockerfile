# ใช้ Node.js เวอร์ชัน 18 แบบ Alpine ขนาดเล็ก
FROM node:18-alpine

# กำหนดโฟลเดอร์หลักใน Container
WORKDIR /app

# คัดลอกไฟล์ package.json
COPY package.json package-lock.json* ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกโค้ดทั้งหมด
COPY . .

# สร้าง Build สำหรับ Production
RUN npm run build

# เปิด Port 3000
EXPOSE 3000

# รันแอปพลิเคชัน
CMD ["npm", "start"]


