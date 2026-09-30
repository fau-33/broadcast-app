interface QRCodeModalProps {
  connectionName: string;
  onConnect: () => void;
  onClose: () => void;
}

export function QRCodeModal({
  connectionName,
  onConnect,
  onClose,
}: QRCodeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-center space-y-6 shadow-2xl">
        <div>
          <h3 className="text-xl font-bold text-white">Escanear QR Code</h3>
          <p className="text-slate-400 text-sm mt-1">
            Conecte o WhatsApp para{" "}
            <span className="text-blue-400 font-semibold">
              {connectionName}
            </span>
          </p>
        </div>

        {/* Simulação do QR Code */}
        <div className="bg-white p-4 rounded-xl inline-block mx-auto border-4 border-slate-700">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=connect-${encodeURIComponent(
              connectionName,
            )}`}
            alt="QR Code WhatsApp"
            className="w-48 h-48"
          />
        </div>

        <p className="text-xs text-slate-400">
          Abra o WhatsApp no seu celular &gt; Aparelhos conectados &gt; Conectar
          um aparelho.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConnect}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            Simular Conexão
          </button>
        </div>
      </div>
    </div>
  );
}
