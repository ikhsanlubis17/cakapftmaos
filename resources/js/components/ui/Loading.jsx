import React from 'react';

const Loading = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#041562] text-white">
            <div className="text-center space-y-4">
                <div className="relative mx-auto h-16 w-16 flex items-center justify-center rounded-[6px] bg-white shadow-xl">
                    <img
                        src="/images/logo2.svg"
                        alt="CAKAP FT MAOS Logo"
                        className="h-10 w-10 object-contain"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#11468F] rounded-full border-2 border-[#041562]"></div>
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">
                        CAKAP FT MAOS
                    </h2>
                    <p className="text-xs font-medium text-slate-200 mt-1 uppercase tracking-wider">
                        Memuat Sistem &bull; Harap Tunggu...
                    </p>
                </div>
                <div className="w-6 h-6 border-2 border-white/20 border-t-[#11468F] rounded-full animate-spin mx-auto"></div>
            </div>
        </div>
    );
};

export default Loading;
