export default async function PublicSupplierFormPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Supplier Emission Data</h1>
        <p className="text-gray-600 mb-6">
          Please provide your emission data for the reporting period.
        </p>
        <p className="text-sm text-gray-400">Token: {token}</p>
      </div>
    </div>
  )
}
