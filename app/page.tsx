import { GoogleMap } from '@/app/components/GoogleMap'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Encuentra Restaurantes Cerca de Ti
        </h1>
        <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
          <GoogleMap />
        </div>
      </div>
    </main>
  )
}
