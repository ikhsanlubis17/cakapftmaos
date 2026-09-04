import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center bg-white border border-[#EEEEEE] rounded-[6px] p-8 shadow-sm">
        <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-[6px] bg-[#DA1212]/10 text-[#DA1212] mb-6 shadow-sm">
          <ShieldExclamationIcon className="h-10 w-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#041562] mb-2 tracking-tight">
          Akses Dibatasi
        </h1>
        
        <p className="text-sm text-slate-600 mb-6">
          Akun Anda tidak memiliki hak akses yang mencukupi untuk membuka halaman ini.
        </p>
        
        <div className="bg-[#EEEEEE]/40 border border-[#EEEEEE] rounded-[6px] p-4 mb-6 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Role Terdaftar</span>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider bg-[#041562] text-white">
              {user?.role || 'Unknown'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Halaman ini membutuhkan hak akses administratif khusus. Silakan hubungi Administrator jika terjadi kekeliruan.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate({ to: "/" as any })}
            className="w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-colors"
          >
            Kembali ke Dashboard
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex justify-center items-center px-5 py-2.5 border border-slate-300 text-sm font-semibold rounded-[6px] text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Kembali ke Halaman Sebelumnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
