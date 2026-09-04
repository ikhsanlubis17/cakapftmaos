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
        <div className="bg-white rounded-[6px] p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Foto Inspeksi</h3>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                        <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-48 object-cover rounded-[6px] border border-slate-200"
                        />
                        <button
                            type="button"
                            onClick={() => onRemovePhoto(index)}
                            className="absolute top-2 right-2 p-1.5 bg-[#DA1212] text-white rounded-[4px] hover:bg-rose-700 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                        >
                            <XMarkIcon className="h-4 w-4" />
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
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-[6px] hover:border-[#11468F] hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-900"
            >
                <CameraIcon className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                    {photos.length > 0 ? 'Tambah Foto Lainnya' : 'Ambil Foto APAR'}
                </span>
            </button>

            <p className="text-xs text-slate-500 mt-2 text-center">
                Foto harus diambil langsung dari kamera
            </p>
        </div>
    );
};
