import React from 'react';
import {
    WrenchScrewdriverIcon,
    InformationCircleIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export const SupervisorAssignmentSection = ({
    isSupervisor,
    condition,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    assignedTeknisiId,
    setAssignedTeknisiId,
    supervisorNotes,
    setSupervisorNotes,
    availableTechniciansQuery,
}) => {
    if (condition !== 'damaged') {
        return null;
    }

    if (!isSupervisor) {
        return (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-[8px] p-4 sm:p-4.5 flex items-start space-x-3.5 shadow-2xs">
                <div className="h-8 w-8 rounded-[6px] bg-amber-100 text-amber-800 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <InformationCircleIcon className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <h4 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wider">
                            Alur Tindak Lanjut Penugasan Perbaikan
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-amber-100 text-amber-800 border border-amber-200">
                            SOP HSSE
                        </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                        Temuan kerusakan fisik yang dilaporkan akan otomatis diteruskan ke portal <strong>Supervisor</strong> untuk peninjauan teknis, persetujuan tindakan, dan penetapan jadwal penugasan teknisi perbaikan.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 sm:p-5 rounded-[8px] border-2 border-[#11468F]/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-[6px] bg-[#11468F] text-white flex items-center justify-center flex-shrink-0">
                        <WrenchScrewdriverIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center">
                            Penugasan Teknisi & Jadwal Perbaikan
                            <span className="text-[#DA1212] ml-1">*</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Sebagai Supervisor, tentukan teknisi pelaksana yang bebas bentrok jadwal operasional
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-blue-100 text-[#041562] border border-blue-200">
                    Wewenang Supervisor
                </span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-[8px] p-3.5 flex items-start space-x-3 text-xs text-[#041562]">
                <InformationCircleIcon className="h-5 w-5 text-[#11468F] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <p className="font-bold">SOP Pelaksanaan HSSE Terminal:</p>
                    <p className="text-slate-600 leading-relaxed">
                        Supervisor tidak melakukan perbaikan fisik tabung secara langsung. Sistem memvalidasi ketersediaan waktu teknisi terpilih secara real-time untuk memastikan tidak ada tumpang tindih penugasan.
                    </p>
                </div>
            </div>

            {/* Date & Time Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-[#11468F]" />
                        Tanggal Pelaksanaan Perbaikan <span className="text-[#DA1212]">*</span>
                    </label>
                    <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent bg-white shadow-2xs"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5 text-[#11468F]" />
                        Waktu Mulai Perbaikan (WIB) <span className="text-[#DA1212]">*</span>
                    </label>
                    <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent bg-white shadow-2xs"
                        required
                    />
                </div>
            </div>

            {/* Technician Selection */}
            <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-[#11468F]" />
                        Pilih Teknisi Pelaksana Perbaikan <span className="text-[#DA1212]">*</span>
                    </span>
                    {availableTechniciansQuery.isLoading && (
                        <span className="text-[11px] font-normal text-[#11468F] animate-pulse">
                            Memeriksa jadwal teknisi...
                        </span>
                    )}
                </label>

                {availableTechniciansQuery.isLoading ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] text-center text-xs text-slate-500">
                        Memeriksa ketersediaan jadwal teknisi...
                    </div>
                ) : (availableTechniciansQuery.data || []).length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-[8px] text-xs text-amber-900 flex items-start gap-2.5">
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-900">Tidak ada teknisi yang tersedia pada waktu ini.</p>
                            <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
                                Semua teknisi sedang memiliki jadwal tugas lain pada {scheduleDate} pukul {scheduleTime}. Silakan pilih tanggal atau jam perbaikan yang berbeda di atas.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                        {(availableTechniciansQuery.data || []).map((tech) => {
                            const isSelected = String(assignedTeknisiId) === String(tech.id);

                            return (
                                <button
                                    key={tech.id}
                                    type="button"
                                    onClick={() => setAssignedTeknisiId(tech.id)}
                                    className={`p-3 rounded-[8px] border text-left flex flex-col justify-between transition-all select-none cursor-pointer ${
                                        isSelected
                                            ? 'border-[#11468F] bg-blue-50/70 ring-2 ring-[#11468F]/30 shadow-xs'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {tech.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                                {tech.phone ? `${tech.phone} • ` : ''}{tech.email}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] shrink-0 border bg-emerald-50 text-emerald-700 border-emerald-200">
                                            Tersedia
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Supervisor Notes for Repair */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Instruksi & Catatan Khusus untuk Teknisi
                </label>
                <textarea
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#11468F] focus:border-transparent resize-none bg-white shadow-2xs placeholder:text-slate-400"
                    placeholder="Instruksi spesifik bagian mana yang harus diganti atau diperbaiki oleh teknisi..."
                />
            </div>
        </div>
    );
};

export default SupervisorAssignmentSection;
