
// src/components/ModalConfirmacion.jsx
export default function ModalConfirmacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo = "¿Estás seguro?", 
  mensaje = "Esta acción no se puede deshacer." 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">{titulo}</h3>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}