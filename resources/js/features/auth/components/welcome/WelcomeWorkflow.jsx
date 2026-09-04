import React from 'react';
import { 
    ArrowRightIcon, 
    QrCodeIcon, 
    MapPinIcon, 
    CameraIcon, 
    CheckCircleIcon, 
    ChartBarIcon 
} from '@heroicons/react/24/outline';

const WelcomeWorkflow = () => {
    const workflowSteps = [
        { 
            step: '01', 
            title: 'Scan QR Code', 
            description: 'Arahkan kamera ke QR code APAR untuk identifikasi nomor seri & spesifikasi.', 
            icon: QrCodeIcon 
        },
        { 
            step: '02', 
            title: 'Validasi Lokasi', 
            description: 'Sistem memverifikasi koordinat GPS gawai berada dalam geofence 30 meter.', 
            icon: MapPinIcon 
        },
        { 
            step: '03', 
            title: 'Foto Fisik Langsung', 
            description: 'Dokumentasikan kondisi tabung, segel, selang, & manometer secara langsung.', 
            icon: CameraIcon 
        },
        { 
            step: '04', 
            title: 'Ceklis Kondisi', 
            description: 'Verifikasi parameter tekanan, masa kedaluwarsa, dan kelayakan komponen.', 
            icon: CheckCircleIcon 
        },
        { 
            step: '05', 
            title: 'Sinkronisasi Data', 
            description: 'Laporan tersimpan terenkripsi dan langsung terupdate di dashboard pengawasan.', 
            icon: ChartBarIcon 
        }
    ];

    return (
        <section id="workflow" className="py-20 bg-[#EEEEEE] text-slate-900 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center px-3 py-1 bg-white border border-slate-300 rounded-[6px] mb-3 shadow-2xs">
                        <span className="text-xs font-semibold text-[#041562] tracking-wider uppercase">
                            Alur Pelaksanaan
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#041562] tracking-tight leading-tight mb-3">
                        Alur Kerja Cepat & Anti-Manipulasi
                    </h2>
                    <p className="text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                        Standar operasional terstruktur untuk memastikan setiap inspeksi terekam dengan akurat hanya dalam hitungan menit.
                    </p>
                </div>

                {/* Desktop Workflow */}
                <div className="hidden lg:grid grid-cols-5 gap-4 relative">
                    {workflowSteps.map((step, index) => (
                        <div key={index} className="relative group">
                            <div className="h-full bg-white rounded-[6px] p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-150 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-mono font-bold text-white bg-[#11468F] px-2 py-0.5 rounded-[4px]">
                                            {step.step}
                                        </span>
                                        <div className="w-9 h-9 rounded-[6px] bg-blue-50 border border-blue-100 flex items-center justify-center text-[#11468F]">
                                            <step.icon className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-[#041562] mb-1.5 tracking-tight">
                                        {step.title}
                                    </h3>

                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Arrow between items */}
                            {index < workflowSteps.length - 1 && (
                                <div className="absolute top-1/2 -right-2.5 z-10 transform -translate-y-1/2 pointer-events-none">
                                    <div className="w-5 h-5 rounded-full bg-[#11468F] border border-white flex items-center justify-center text-white shadow-xs">
                                        <ArrowRightIcon className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Workflow */}
                <div className="lg:hidden space-y-3">
                    {workflowSteps.map((step, index) => (
                        <div 
                            key={index}
                            className="bg-white rounded-[6px] p-4 border border-slate-200 flex items-start gap-3.5 shadow-2xs"
                        >
                            <span className="text-xs font-mono font-bold text-white bg-[#11468F] px-2.5 py-1 rounded-[4px] flex-shrink-0">
                                {step.step}
                            </span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <step.icon className="h-4 w-4 text-[#11468F]" />
                                    <h3 className="text-sm font-bold text-[#041562]">
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WelcomeWorkflow;
