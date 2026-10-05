import React from 'react';
import {
    CameraIcon,
    XMarkIcon,
    ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

export const RepairCameraModal = ({
    cameraTarget,
    closeCamera,
    videoRef,
    streamRef,
    attachStreamToVideo,
    cameraLoading,
    capturePhoto,
    toggleCameraFacingMode,
}) => {
    if (!cameraTarget) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
            {/* Top Viewfinder Bar */}
            <div className="flex items-center justify-between text-white max-w-xl mx-auto w-full">
                <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">
                        {cameraTarget.title || 'Kamera Lapangan'}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={closeCamera}
                    className="p-2 text-slate-300 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                    title="Tutup Kamera"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Video Viewport Area */}
            <div className="relative flex-1 max-w-xl mx-auto w-full my-4 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Always keep video element mounted so ref and stream remain persistent */}
                <video
                    ref={(el) => {
                        videoRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                            attachStreamToVideo(el, streamRef.current);
                        }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                {/* Viewfinder Target Reticle Overlay */}
                <div className="absolute inset-8 sm:inset-12 border-2 border-white/30 rounded-lg pointer-events-none flex items-center justify-center">
                    <div className="h-4 w-4 border-t-2 border-l-2 border-white absolute -top-0.5 -left-0.5" />
                    <div className="h-4 w-4 border-t-2 border-r-2 border-white absolute -top-0.5 -right-0.5" />
                    <div className="h-4 w-4 border-b-2 border-l-2 border-white absolute -bottom-0.5 -left-0.5" />
                    <div className="h-4 w-4 border-b-2 border-r-2 border-white absolute -bottom-0.5 -right-0.5" />
                </div>

                {/* Camera Loading Overlay */}
                {cameraLoading && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 text-white z-10">
                        <div className="h-10 w-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-slate-300">Menghubungkan sensor kamera...</p>
                    </div>
                )}
            </div>

            {/* Bottom Shutter Controls */}
            <div className="flex items-center justify-around max-w-xl mx-auto w-full pb-2">
                {/* Cancel Button */}
                <button
                    type="button"
                    onClick={closeCamera}
                    className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
                >
                    Batal
                </button>

                {/* Main Shutter Button */}
                <button
                    type="button"
                    disabled={cameraLoading}
                    onClick={capturePhoto}
                    className="h-16 w-16 rounded-full bg-white hover:bg-slate-200 text-[#041562] p-1 shadow-lg ring-4 ring-white/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    title="Ambil Foto"
                >
                    <div className="h-13 w-13 rounded-full border-2 border-[#041562] flex items-center justify-center">
                        <CameraIcon className="h-7 w-7 text-[#041562]" />
                    </div>
                </button>

                {/* Switch Camera Button (Facing Mode) */}
                <button
                    type="button"
                    onClick={toggleCameraFacingMode}
                    className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Balik Kamera"
                >
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Kamera</span>
                </button>
            </div>
        </div>
    );
};

export default RepairCameraModal;
