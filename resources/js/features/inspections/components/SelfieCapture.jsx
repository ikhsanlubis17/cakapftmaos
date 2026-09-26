import React from 'react';
import {
    UserIcon,
    CameraIcon,
    XMarkIcon,
    CheckCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

const SelfieCapture = ({
    selfie,
    selfieCameraActive,
    selfieLoading,
    startSelfieCamera,
    captureSelfie,
    stopSelfieCamera,
    selfieVideoRef,
    selfieCanvasRef,
    captureCountdown,
    showFlash,
    setSelfie,
}) => (
    <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200 shadow-xs space-y-3.5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-[6px] bg-blue-50 text-[#11468F] ring-1 ring-blue-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center">
                        Selfie Teknisi
                        <span className="text-[#DA1212] ml-1">*</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                        Wajib verifikasi kehadiran langsung di titik APAR
                    </p>
                </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
                Langkah 2
            </span>
        </div>

        {/* Empty State: Ready to Capture */}
        {!selfie && !selfieCameraActive && (
            <button
                type="button"
                onClick={startSelfieCamera}
                disabled={selfieLoading}
                className="w-full h-56 sm:h-64 bg-slate-50/70 border-2 border-dashed border-slate-300 hover:border-[#11468F] hover:bg-blue-50/30 rounded-[8px] flex flex-col items-center justify-center p-4 transition-all duration-200 group shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-105 group-hover:border-[#11468F] transition-all text-[#11468F] shadow-xs">
                    <UserIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <p className="mt-3 text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#041562]">
                    Buka Kamera Selfie
                </p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs text-center leading-relaxed">
                    Ambil foto wajah Anda di depan tabung APAR
                </p>
                <span className="mt-3 inline-flex items-center px-3 py-1.5 rounded-[6px] bg-[#11468F] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-[#041562] transition-colors shadow-xs">
                    <CameraIcon className="w-3.5 h-3.5 mr-1.5" />
                    Ambil Selfie
                </span>
            </button>
        )}

        {/* Active Camera Viewfinder */}
        {selfieCameraActive && !selfie && (
            <div className="relative bg-slate-950 rounded-[8px] overflow-hidden shadow-md h-72 sm:h-80 w-full flex items-center justify-center">
                <video
                    ref={selfieVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <canvas ref={selfieCanvasRef} className="hidden" />

                {/* Subtle Face Guide Oval Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-[50%] border-2 border-dashed border-white/60 shadow-xs" />
                </div>

                {/* Countdown Overlay */}
                {captureCountdown > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs z-20">
                        <div className="text-white text-7xl font-black font-mono animate-ping">
                            {captureCountdown}
                        </div>
                    </div>
                )}

                {/* Flash Overlay */}
                {showFlash && (
                    <div className="absolute inset-0 bg-white z-30 animate-flash" />
                )}

                {/* Live Indicator Top Badge */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-[4px] text-[11px] font-bold flex items-center space-x-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Kamera Depan</span>
                </div>

                {/* Bottom Camera Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex justify-center items-center space-x-5">
                    <button
                        type="button"
                        onClick={stopSelfieCamera}
                        className="p-2.5 rounded-[6px] bg-slate-800/80 text-white hover:bg-slate-700 transition-colors backdrop-blur-md cursor-pointer"
                        title="Batal"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>

                    <button
                        type="button"
                        onClick={captureSelfie}
                        disabled={captureCountdown > 0}
                        className="p-1 rounded-full border-2 border-white/60 hover:border-white transition-all disabled:opacity-50 cursor-pointer"
                        title="Jepret Selfie"
                    >
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#11468F] hover:bg-[#041562] border-2 border-white transition-all transform active:scale-95 shadow-md flex items-center justify-center text-white">
                            <CameraIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                    </button>
                </div>
            </div>
        )}

        {/* Captured Photo Preview */}
        {selfie && (
            <div className="space-y-3">
                <div className="relative rounded-[8px] overflow-hidden shadow-sm h-64 sm:h-72 bg-slate-900">
                    <img
                        src={URL.createObjectURL(selfie)}
                        alt="Selfie Teknisi"
                        className="w-full h-full object-contain transform scale-x-[-1]"
                    />
                    <div className="absolute bottom-3 left-3 bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-[4px] text-xs font-bold shadow-md flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                        Selfie Teknisi Terverifikasi
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setSelfie(null)}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-[6px] font-bold text-xs uppercase tracking-wider shadow-2xs transition-colors cursor-pointer"
                >
                    <ArrowPathIcon className="h-4 w-4 mr-1.5 text-slate-500" />
                    Ambil Ulang Selfie
                </button>
            </div>
        )}
    </div>
);

export default SelfieCapture;
