/**
 * Public pages have their own minimal layout without the navigation sidebar.
 * This layout is used for the supplier data-entry form accessible via a public token.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
