/** Layout for public-facing pages (no sidebar, no auth) */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
