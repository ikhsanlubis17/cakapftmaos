const Loading = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-lg mb-4">
                    <img
                        src="/images/logo2.svg"
                        alt="CAKAP FT MAOS Logo"
                        className="h-10 w-10"
                    />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    CAKAP FT MAOS
                </h2>
                <p className="text-gray-500">Memuat aplikasi...</p>
            </div>
        </div>
    );
}

export default Loading;
