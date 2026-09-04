import React, { useReducer } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "../../contexts/ToastContext";
import {
    QrCodeIcon,
    ArrowLongUpIcon,
    ArrowPathIcon,
    CameraIcon,
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
const Header = ({ state, onStart }: { state: string; onStart: () => void }) => (
    <div className="bg-white rounded-[6px] p-6 border border-[#EEEEEE] shadow-sm">
        <div className="text-center">
            <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-[6px] bg-[#041562] text-white mb-4 shadow-sm">
                <QrCodeIcon className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">
                Scan QR Code APAR
            </h1>
            <p className="text-xs text-slate-500">
                Arahkan kamera ke QR Code yang terpasang pada APAR
            </p>
            {state === "initial" && (
                <button
                    onClick={onStart}
                    className="mx-auto mt-4 px-6 py-2.5 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[6px] text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center justify-center space-x-2 transition-colors"
                >
                    <ArrowLongUpIcon className="h-4 w-4" />
                    <span>Mulai Scan</span>
                </button>
            )}
        </div>
    </div>
);

const CameraErrorDisplay = ({ onRetry }: { onRetry: () => void }) => (
    <div className="bg-white border border-rose-200 rounded-[6px] p-5 shadow-sm">
        <div className="flex">
            <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-[4px] bg-rose-50 border border-rose-200 flex items-center justify-center">
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
                    Error Kamera
                </h3>
                <div className="mt-1 text-xs text-rose-700 leading-relaxed">
                    Tidak dapat mengakses kamera. Pastikan izin kamera diberikan
                    dan perangkat Anda memiliki kamera yang berfungsi.
                </div>
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="bg-rose-50 px-3 py-1.5 text-xs font-semibold text-[#DA1212] hover:bg-rose-100 border border-rose-200 rounded-[6px] transition-colors"
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
    <div className="bg-white rounded-[6px] p-6 border border-[#EEEEEE] shadow-sm">
        <Scanner
            onScan={onScan}
            onError={onError}
            scanDelay={500}
            paused={paused}
        />

        <div className="mt-4 text-center">
            {scannerState === "scanning" && (
                <p className="text-xs text-slate-600 font-semibold text-center">
                    Scanning... Arahkan kamera ke QR Code
                </p>
            )}
            {scannerState === "barcodeDetected" && (
                <p className="text-xs text-emerald-700 font-bold">
                    ✓ QR Code terdeteksi! Memvalidasi...
                </p>
            )}
            {validatePending && (
                <p className="text-xs text-slate-500 font-medium">
                    Memvalidasi QR Code...
                </p>
            )}
        </div>

        {scannerState === "scanning" && (
            <button
                onClick={onReset}
                className="w-full mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center space-x-1.5"
            >
                <ArrowPathIcon className="h-4 w-4 text-slate-500" />
                <span>Mulai Ulang</span>
            </button>
        )}
    </div>
);

const InstructionsPanel = () => (
    <div className="bg-white border border-[#EEEEEE] rounded-[6px] p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-3">
            <div className="h-6 w-6 rounded-[4px] bg-[#041562] text-white flex items-center justify-center">
                <CameraIcon className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Petunjuk Penggunaan
            </h3>
        </div>
        <ul className="text-slate-600 space-y-2 text-xs">
            <li className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                    1
                </span>
                <span>
                    Pastikan QR Code APAR terlihat jelas dan tidak rusak
                </span>
            </li>
            <li className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                    2
                </span>
                <span>Jaga kamera tetap stabil dan tidak bergerak</span>
            </li>
            <li className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                    3
                </span>
                <span>Pastikan pencahayaan cukup dan tidak ada bayangan</span>
            </li>
            <li className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#11468F] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                    4
                </span>
                <span>QR Code akan otomatis ter-scan saat terdeteksi</span>
            </li>
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
                CAKAP FT MAOS - Sistem Monitoring APAR
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
    const { apiClient } = useAuth();

    const validateMutation = useMutation({
        mutationFn: async (qrCode: string) => {
            const resp = await apiClient.post("/api/inspections/validate", {
                apar_qrCode: qrCode,
            });
            return resp.data;
        },
        retry: false, // Don't retry validation checks
    });

    const onScanSuccess = async (barcode: IDetectedBarcode[]) => {
        try {
            console.log("QR Code detected:", barcode[0].rawValue);

            // Pause scanner to prevent multiple scans
            dispatch({ type: "barcodeDetected" });

            // Extract QR code from decoded text
            const qrCode = barcode[0].rawValue.trim();

            // Validate QR code format
            if (qrCode && qrCode.length > 0) {
                try {
                    const data = await validateMutation.mutateAsync(qrCode);

                    if (data?.valid) {
                        showSuccess(
                            "QR Code berhasil di-scan! Mengarahkan ke form inspeksi..."
                        );

                        // Navigate to inspection form with QR code and schedule info
                        setTimeout(() => {
                            const scheduleId = data.schedule?.id;
                            const navigationPath = scheduleId
                                ? `/inspections/enhanced/${qrCode}?schedule_id=${scheduleId}`
                                : `/inspections/enhanced/${qrCode}`;
                            
                            navigate({ to: navigationPath } as any);
                        }, 1500);
                    } else {
                        // Data valid: false (business logic failure)
                        // Backend now returns 200 OK for this, so it lands here.
                        showError(data?.message || "QR Code tidak valid atau tidak ada jadwal");
                        resetScanner();
                    }
                } catch (error: any) {
                    // Only genuine network/server errors land here now (500s)
                    const axiosError = error as AxiosError<any>;
                    
                    console.error("Error validating QR code:", error);
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

    const resetScanner = () => {
        setTimeout(() => {
            dispatch({ type: "reset" });
        }, 2000);
    };

    const onScanFailure = (error: unknown) => {
        // Handle scan failure silently (user might be moving camera)
       // console.log("QR scan failed:", error); 
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6">
            <div className="max-w-lg mx-auto p-4 space-y-6">
                <Header
                    state={scannerState.state}
                    onStart={() => dispatch({ type: "start" })}
                />

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

                <InstructionsPanel />
                <FooterBar />
            </div>
        </div>
    );
};

export default QRScanner;
