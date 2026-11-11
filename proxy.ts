import { NextRequest, NextResponse } from 'next/server';

const EVENT_TOKEN_COOKIE = 'th_event_token';

// 인앱 브라우저는 첫 문서 요청에만 Authorization 을 실어 보내므로,
// 이후 수령 요청(fetch)에서도 쓸 수 있게 httpOnly 쿠키로 옮겨 둔다.
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.headers.get('authorization');

  if (token) {
    response.cookies.set(EVENT_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
  }

  return response;
}

export const config = {
  matcher: ['/events/:path*'],
};
