// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ถ้าพยายามเข้าหน้าอื่นที่ไม่ใช่หน้าแรก (Login) แต่ยังไม่ได้ Login -> ไล่กลับไปหน้าแรก
  if (!user && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ถ้า Login แล้วแต่จะพยายามกลับไปหน้า Login -> ส่งไปหน้าทำงานเลย (ถ้าคุณแยกหน้า)
  // หรือถ้าคุณใช้หน้าเดียวแบบตอนนี้ ก็ไม่ต้องทำอะไร

  return response
}

// ระบุว่าให้ Middleware ทำงานกับหน้าไหนบ้าง (ป้องกันทุกหน้ายกเว้นหน้า Login และ API)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',],
}