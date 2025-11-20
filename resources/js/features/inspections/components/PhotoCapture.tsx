import React, { useRef } from 'react';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PhotoCaptureProps {
    photos: string[];
    onPhotoCapture: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePhoto: (index: number) => void;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
    photos,
    onPhotoCapture,
    onRemovePhoto,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto Inspeksi</h3>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                        <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                            type="button"
                            onClick={() => onRemovePhoto(index)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Capture Button */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhotoCapture}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex items-center justify-center space-x-2 text-gray-700 hover:text-red-600"
            >
                <CameraIcon className="h-6 w-6" />
                <span className="font-medium">
                    {photos.length > 0 ? 'Tambah Foto Lainnya' : 'Ambil Foto APAR'}
                </span>
            </button>

            <p className="text-sm text-gray-500 mt-2 text-center">
                Foto harus diambil langsung dari kamera
            </p>
        </div>
    );
};
