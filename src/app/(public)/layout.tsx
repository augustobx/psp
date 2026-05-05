import { prisma } from "@/lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  const isEnabled = settings?.pwaEnabled ?? true;

  // Si el switch de la PWA está desactivado, mostramos esta pantalla
  if (!isEnabled) {
    // Limpiamos el número de teléfono para asegurar que el link de WhatsApp funcione
    const phone = settings?.contactPhone?.replace(/\D/g, '') || "";
    const waLink = `https://wa.me/${phone}?text=Hola,%20quiero%20reservar%20un%20turno.`;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservas Pausadas</h1>
          <p className="text-gray-600 mb-8">
            El sistema automático de reservas está desactivado momentáneamente. ¡Escribinos directamente por WhatsApp para coordinar tu turno!
          </p>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full">
            <button className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Reservar por WhatsApp
            </button>
          </a>
        </div>
      </div>
    );
  }

  // Si está activado, carga el sistema normal
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}