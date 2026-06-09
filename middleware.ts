import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for mock user session in cookies
  const mockUserId = request.cookies.get("mock_user_id")?.value;
  
  // Protected routes
  const protectedPaths = ["/dashboard", "/admin", "/hostess", "/supervisor"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !mockUserId) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Redirect logged in users away from auth pages
  if (mockUserId && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
