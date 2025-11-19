import { X, Upload, FileJson, AlertCircle } from 'lucide-react';

export const UploadModal = ({
    onClose,
    onUpload,
    onUseSampleData,
    uploadError,
    fileInputRef,
    }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileJson className="text-blue-600" size={24} />
                Importer des données
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
            </button>
            </div>

            <div className="space-y-4">
            <p className="text-gray-600 text-sm">
                Importe ton fichier JSON de cocktails
            </p>

            {/* Zone de drop/selection de fichier */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onUpload}
                className="hidden"
                id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">Clique pour sélectionner</p>
                <p className="text-xs text-gray-400 mt-1">Format JSON uniquement</p>
                </label>
            </div>

            {/* Affichage des erreurs */}
            {uploadError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-800">{uploadError}</p>
                </div>
            )}

            {/* Bouton pour utiliser les données d'exemple */}
            <div className="pt-4 border-t">
                <button
                onClick={onUseSampleData}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                Utiliser les données d'exemple
                </button>
            </div>
            </div>
        </div>
        </div>
    );
};
