import React, { useReducer, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "../../contexts/ToastContext";
import {
    QrCodeIcon,
    ArrowLongUpIcon,
    ArrowPathIcon,
    CameraIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useAuth } from "../../contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Types
interface QRScannerState {
    state: "initial" | "scanning" | "barcodeDetected" | "cameraError";
}

type ScannerAction =
    | { type: "start" }
    | { type: "barcodeDetected" }
    | { type: "cameraError" }
    | { type: "reset" };

interface ScannerContainerProps {
    onScan: (result: IDetectedBarcode[]) => void;
    onError: (error: unknown) => void;
    paused: boolean;
    scannerState: string;
    validatePending: boolean;
    onReset: () => void;
}

// Subcomponents
const Header = ({
    activeMode,
    setActiveMode,
    state,
    onStart,
}: {
    activeMode: "qr_scan" | "manual_serial";
    setActiveMode: (mode: "qr_scan" | "manual_serial") => void;
    state: string;
    onStart: () => void;
}) => (
    <div className="bg-white rounded-[8px] p-6 border border-slate-200 shadow-sm">
        <div className="text-center">
            <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-[8px] bg-[#041562] text-white mb-4 shadow-sm">
                {activeMode === "qr_scan" ? (
                    <QrCodeIcon className="h-7 w-7" />
                ) : (
                    <DocumentTextIcon className="h-7 w-7" />
                )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">
                Identifikasi Tabung APAR
            </h1>
            <p className="text-xs text-slate-500 mb-5">
                Pilih metode identifikasi untuk memulai inspeksi berkala di fasilitas FT Maos
            </p>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-[8px] border border-slate-200 w-full max-w-sm mb-4">
                <button
                    type="button"
                    onClick={() => setActiveMode("qr_scan")}
                    className={`flex-1 py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeMode === "qr_scan"
                            ? "bg-[#11468F] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <QrCodeIcon className="h-4 w-4" />
                    <span>Scan Kamera QR</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveMode("manual_serial")}
                    className={`flex-1 py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeMode === "manual_serial"
                            ? "bg-[#11468F] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Nomor Seri Manual</span>
                </button>
            </div>

            {activeMode === "qr_scan" && state === "initial" && (
                <div>
                    <button
                        onClick={onStart}
                        className="mx-auto mt-2 px-6 py-2.5 min-h-[44px] bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[6px] text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                        <ArrowLongUpIcon className="h-4 w-4" />
                        <span>Mulai Kamera Scanner</span>
                    </button>
                </div>
            )}
        </div>
    </div>
);

const CameraErrorDisplay = ({ onRetry }: { onRetry: () => void }) => (
    <div className="bg-white border border-rose-200 rounded-[8px] p-5 shadow-sm">
        <div className="flex">
            <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-[6px] bg-rose-50 border border-rose-200 flex items-center justify-center">
                    <svg
                        className="h-5 w-5 text-[#DA1212]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
            <div className="ml-3.5">
                <h3 className="text-sm font-bold text-slate-900">
                    Akses Kamera Terhambat
                </h3>
                <div className="mt-1 text-xs text-rose-700 leading-relaxed">
                    Tidak dapat mengakses modul kamera peramban. Pastikan izin kamera telah diberikan atau gunakan opsi <strong>Nomor Seri Manual</strong>.
                </div>
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-[#DA1212] hover:bg-rose-100 border border-rose-200 rounded-[6px] transition-colors cursor-pointer"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const ScannerContainer = ({
    onScan,
    onError,
    paused,
    scannerState,
    validatePending,
    onReset,
}: ScannerContainerProps) => (
    <div className="bg-white rounded-[8px] p-6 border border-slate-200 shadow-sm">
        <Scanner
            onScan={onScan}
            onError={onError}
            scanDelay={500}
            paused={paused}
        />

        <div className="mt-4 text-center">
            {scannerState === "scanning" && (
                <p className="text-xs text-slate-600 font-semibold text-center animate-pulse">
                    Mengarahkan kamera ke kode QR stiker tabung APAR...
                </p>
            )}
            {scannerState === "barcodeDetected" && (
                <p className="text-xs text-emerald-700 font-bold">
                    ✓ QR Code terdeteksi! Memverifikasi ke server...
                </p>
            )}
            {validatePending && (
                <p className="text-xs text-slate-500 font-medium">
                    Memvalidasi jadwal & hak akses teknisi...
                </p>
            )}
        </div>

        {scannerState === "scanning" && (
            <button
                onClick={onReset}
                className="w-full mt-4 px-4 py-2.5 min-h-[44px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-[6px] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
                <ArrowPathIcon className="h-4 w-4 text-slate-500" />
                <span>Reset Kamera</span>
            </button>
        )}
    </div>
);

const ManualSerialContainer = ({
    serialNumber,
    setSerialNumber,
    onSubmit,
    isLoading,
}: {
    serialNumber: string;
    setSerialNumber: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
}) => (
    <div className="bg-white rounded-[8px] p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-[6px] bg-blue-50 text-[#11468F] border border-blue-200 flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-900">
                    Input Nomor Seri Tabung Manual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Ketik nomor seri resmi yang tertera pada bodi atau plat identitas tabung jika stiker QR tergores/rusak.
                </p>
            </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 pt-1">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nomor Seri APAR
                </label>
                <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    placeholder="Contoh: APAR-001 atau DCP-04"
                    disabled={isLoading}
                    className="w-full px-4 py-3 min-h-[48px] font-mono text-base font-bold uppercase tracking-wider text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
                    autoFocus
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !serialNumber.trim()}
                className="w-full min-h-[48px] bg-[#11468F] hover:bg-[#041562] text-white px-5 py-3 rounded-[6px] font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        <span>Memverifikasi Jadwal...</span>
                    </>
                ) : (
                    <>
                        <ShieldCheckIcon className="h-5 w-5" />
                        <span>Periksa Jadwal & Mulai Inspeksi</span>
                    </>
                )}
            </button>
        </form>

        {/* Anti-fraud & Integrity Notice */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-[6px] p-3 flex items-start gap-2.5">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                <strong>Ketentuan HSSE:</strong> Verifikasi koordinat GPS (radius lokasi tabung) dan foto kamera langsung (kondisi APAR & selfie teknisi) tetap wajib dilakukan saat pengisian formulir.
            </p>
        </div>
    </div>
);

const InstructionsPanel = ({ activeMode }: { activeMode: "qr_scan" | "manual_serial" }) => (
    <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-3">
            <div className="h-6 w-6 rounded-[4px] bg-[#041562] text-white flex items-center justify-center">
                <CameraIcon className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Petunjuk Operasional Teknisi
            </h3>
        </div>
        <ul className="text-slate-600 space-y-2 text-xs">
            {activeMode === "qr_scan" ? (
                <>
                    <li className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            1
                        </span>
                        <span>Pastikan lensa kamera bersih dan arahkan ke stiker QR tabung APAR.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            2
                        </span>
                        <span>Jaga kamera stabil hingga sistem membaca kode secara otomatis.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            3
                        </span>
                        <span>Jika stiker QR terkelupas atau kotor, beralihlah ke tab <strong>Nomor Seri Manual</strong>.</span>
                    </li>
                </>
            ) : (
                <>
                    <li className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            1
                        </span>
                        <span>Lihat plat nomor seri logam atau cetakan stiker nomor tabung di lokasi fisik.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            2
                        </span>
                        <span>Ketik nomor seri dengan tepat, lalu tekan tombol periksa jadwal.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            3
                        </span>
                        <span>Laporkan ke Pengawas/Admin jika stiker QR pada tabung tersebut memerlukan penggantian cetak baru.</span>
                    </li>
                </>
            )}
        </ul>
    </div>
);

const FooterBar = () => (
    <div className="text-center py-3">
        <div className="flex items-center justify-center space-x-2">
            <img
                src="/images/logo2.svg"
                alt="CAKAP FT MAOS Logo"
                className="h-4 w-4"
            />
            <p className="text-xs text-slate-500 font-medium">
                CAKAP FT MAOS &bull; Sistem Monitoring & Inspeksi APAR Modern
            </p>
        </div>
    </div>
);

function scannerReducer(
    state: QRScannerState,
    action: ScannerAction
): QRScannerState {
    switch (action.type) {
        case "start":
            return { ...state, state: "scanning" };
        case "barcodeDetected":
            return { ...state, state: "barcodeDetected" };
        case "cameraError":
            return { ...state, state: "cameraError" };
        case "reset":
            return { ...state, state: "initial" };
        default:
            return state;
    }
}

const QRScanner = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [scannerState, dispatch] = useReducer(scannerReducer, {
        state: "initial",
    });
    const [activeMode, setActiveMode] = useState<"qr_scan" | "manual_serial">("qr_scan");
    const [serialNumberInput, setSerialNumberInput] = useState<string>("");
    const { apiClient } = useAuth();

    const validateMutation = useMutation({
        mutationFn: async ({
            identifier,
            method,
        }: {
            identifier: string;
            method: "qr_scan" | "manual_serial";
        }) => {
            const resp = await apiClient.post("/api/inspections/validate", {
                identifier,
                method,
            });
            return resp.data;
        },
        retry: false, // Don't retry validation checks
    });

    const onScanSuccess = async (barcode: IDetectedBarcode[]) => {
        try {
            // Pause scanner to prevent multiple scans
            dispatch({ type: "barcodeDetected" });

            // Extract QR code from decoded text
            const qrCode = barcode[0].rawValue.trim();

            if (qrCode && qrCode.length > 0) {
                try {
                    const data = await validateMutation.mutateAsync({
                        identifier: qrCode,
                        method: "qr_scan",
                    });

                    if (data?.valid) {
                        showSuccess(
                            "QR Code valid! Mengarahkan ke form inspeksi..."
                        );

                        setTimeout(() => {
                            const scheduleId = data.schedule?.id;
                            const targetQr = data.apar?.qr_code || qrCode;
                            const navigationPath = scheduleId
                                ? `/inspections/enhanced/${targetQr}?schedule_id=${scheduleId}&method=qr_scan`
                                : `/inspections/enhanced/${targetQr}?method=qr_scan`;

                            navigate({ to: navigationPath } as any);
                        }, 1200);
                    } else {
                        showError(data?.message || "QR Code tidak valid atau tidak ada jadwal hari ini");
                        resetScanner();
                    }
                } catch (error: any) {
                    const axiosError = error as AxiosError<any>;
                    const errorMessage =
                        axiosError.response?.data?.message ||
                        axiosError.message ||
                        "Terjadi kesalahan saat memvalidasi QR Code";
                    showError(errorMessage);
                    resetScanner();
                }
            } else {
                showError("QR Code tidak valid");
                resetScanner();
            }
        } catch (error) {
            console.error("Error handling scan success:", error);
            showError("Terjadi kesalahan saat memproses QR Code");
            resetScanner();
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = serialNumberInput.trim();
        if (!trimmed) {
            showError("Silakan masukkan nomor seri APAR");
            return;
        }

        try {
            const data = await validateMutation.mutateAsync({
                identifier: trimmed,
                method: "manual_serial",
            });

            if (data?.valid) {
                showSuccess("Nomor Seri APAR valid! Mengarahkan ke formulir...");
                setTimeout(() => {
                    const scheduleId = data.schedule?.id;
                    const targetQr = data.apar?.qr_code || trimmed;
                    const navigationPath = scheduleId
                        ? `/inspections/enhanced/${targetQr}?schedule_id=${scheduleId}&method=manual_serial`
                        : `/inspections/enhanced/${targetQr}?method=manual_serial`;

                    navigate({ to: navigationPath } as any);
                }, 1200);
            } else {
                showError(
                    data?.message ||
                        "Nomor Seri APAR tidak valid atau tidak memiliki jadwal aktif hari ini."
                );
            }
        } catch (error: any) {
            const axiosError = error as AxiosError<any>;
            showError(
                axiosError.response?.data?.message ||
                    "Gagal memvalidasi nomor seri APAR. Periksa kembali inputan Anda."
            );
        }
    };

    const resetScanner = () => {
        setTimeout(() => {
            dispatch({ type: "reset" });
        }, 2000);
    };

    const onScanFailure = (_error: unknown) => {
        // Handle scan failure silently (user might be moving camera)
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6">
            <div className="max-w-lg mx-auto p-4 space-y-6">
                <Header
                    activeMode={activeMode}
                    setActiveMode={setActiveMode}
                    state={scannerState.state}
                    onStart={() => dispatch({ type: "start" })}
                />

                {/* Mode 1: QR Camera Scanner */}
                {activeMode === "qr_scan" && (
                    <>
                        {scannerState.state === "cameraError" && (
                            <CameraErrorDisplay
                                onRetry={() => dispatch({ type: "reset" })}
                            />
                        )}

                        {scannerState.state !== "initial" &&
                            scannerState.state !== "cameraError" && (
                                <ScannerContainer
                                    onScan={onScanSuccess}
                                    onError={onScanFailure}
                                    paused={
                                        scannerState.state === "barcodeDetected" ||
                                        validateMutation.status === "pending"
                                    }
                                    scannerState={scannerState.state}
                                    validatePending={
                                        validateMutation.status === "pending"
                                    }
                                    onReset={() => dispatch({ type: "reset" })}
                                />
                            )}
                    </>
                )}

                {/* Mode 2: Manual Serial Input */}
                {activeMode === "manual_serial" && (
                    <ManualSerialContainer
                        serialNumber={serialNumberInput}
                        setSerialNumber={setSerialNumberInput}
                        onSubmit={handleManualSubmit}
                        isLoading={validateMutation.status === "pending"}
                    />
                )}

                <InstructionsPanel activeMode={activeMode} />
                <FooterBar />
            </div>
        </div>
    );
};

export default QRScanner;
