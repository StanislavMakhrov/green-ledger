/**
 * Layout for public pages — no nav sidebar, full-width minimal design.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <span className="text-lg font-bold text-green-700">🌿 GreenLedger</span>
        <span className="text-sm text-gray-400 ml-2">Supplier Emissions Data Collection</span>
      </header>
      <main className="max-w-xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
