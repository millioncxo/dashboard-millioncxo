// Force all API routes to be dynamic (no static prerender at build).
// Required because auth uses request.cookies, which is only available at request time.
export const dynamic = 'force-dynamic';

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
