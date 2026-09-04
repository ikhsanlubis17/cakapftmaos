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
        { step: 1, title: 'Scan QR', description: 'Scan QR code APAR dengan kamera', icon: QrCodeIcon },
        { step: 2, title: 'Validasi Lokasi', description: 'Sistem memvalidasi lokasi GPS', icon: MapPinIcon },
        { step: 3, title: 'Ambil Foto', description: 'Foto APAR langsung dari kamera', icon: CameraIcon },
        { step: 4, title: 'Isi Form', description: 'Input kondisi dan catatan APAR', icon: CheckCircleIcon },
        { step: 5, title: 'Submit', description: 'Data tersimpan dan muncul di dashboard', icon: ChartBarIcon }
    ];

    return (
        <section id="workflow" className="py-20 lg:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 lg:mb-20">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-6">
                        <ArrowRightIcon className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-semibold text-blue-700">Proses Inspeksi</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Alur Kerja Inspeksi
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Proses inspeksi APAR yang sederhana namun terjamin keakuratannya
                    </p>
                </div>

                {/* Desktop Workflow */}
                <div className="hidden lg:block">
                    <div className="relative">
                        <div className="flex justify-between items-start">
                            {workflowSteps.map((step, index) => (
                                <div key={index} className="group text-center relative flex-1 max-w-xs">
                                    <div className="bg-white rounded-2xl p-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 mx-4">
                                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg group-hover:scale-110 transition-all duration-300">
                                            {step.step}
                                        </div>
                                        
                                        <div className="bg-gray-50 rounded-xl p-4 mb-4 group-hover:bg-red-50 transition-colors duration-300">
                                            <step.icon className="h-8 w-8 text-gray-600 mx-auto group-hover:text-red-600 transition-colors duration-300" />
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                                            {step.title}
                                        </h3>

                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Connection Arrow */}
                                    {index < workflowSteps.length - 1 && (
                                        <div className="absolute top-12 -right-6 z-10">
                                            <div className="bg-white rounded-full p-2 shadow-lg">
                                                <ArrowRightIcon className="h-6 w-6 text-red-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Workflow */}
                <div className="lg:hidden space-y-6">
                    {workflowSteps.map((step, index) => (
                        <div key={index} className="group">
                            <div className="bg-white rounded-2xl p-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-gray-100">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                                        {step.step}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <step.icon className="h-6 w-6 text-gray-600 mr-3 group-hover:text-red-600 transition-colors duration-300" />
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                                                {step.title}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Arrow */}
                            {index < workflowSteps.length - 1 && (
                                <div className="flex justify-center my-4">
                                    <div className="bg-gray-100 rounded-full p-2">
                                        <ArrowRightIcon className="h-5 w-5 text-red-500 rotate-90" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WelcomeWorkflow;
