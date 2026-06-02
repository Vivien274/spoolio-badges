export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="text-6xl mb-4">🔑</div>
      <h1 className="text-3xl font-black text-orange-500 mb-2">Spoolio Badge</h1>
      <p className="text-gray-600 max-w-xs">
        Scanne le QR code ou tape l&apos;URL de ton badge pour accéder à ta fiche SOS.
      </p>
    </main>
  )
}
