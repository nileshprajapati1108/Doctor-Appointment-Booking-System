import { AlertCircle, X, Check } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className={`p-4 border-b flex items-center gap-3 ${isDangerous ? "bg-red-50" : "bg-blue-50"}`}>
          <AlertCircle size={24} className={isDangerous ? "text-red-500" : "text-blue-500"} />
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-700 text-center">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <X size={18} className="inline mr-2" />
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium transition flex items-center gap-2 ${
              isDangerous
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <Check size={18} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
