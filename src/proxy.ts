import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLogin = req.nextUrl.pathname.startsWith('/login')

  if (!user && !isLogin) {
    const redirect = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  if (user && isLogin) {
    const redirect = NextResponse.redirect(new URL('/dashboard', req.url))
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
