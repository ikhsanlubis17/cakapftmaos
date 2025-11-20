import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ScheduleFilters from '../components/ScheduleFilters/ScheduleFilters';
import ScheduleTable from '../components/ScheduleTable/ScheduleTable';
import ScheduleModal from '../components/ScheduleModal/ScheduleModal';
import ScheduleDetailModal from '../components/ScheduleDetailModal/ScheduleDetailModal';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import ScheduleActions from '../components/ScheduleActions';
import { useScheduleManagement } from '../hooks/useScheduleManagement';

const SchedulesManagement: React.FC = () => {
    const {
        // Data
        schedules,
        apars,
        teknisi,
        pagination,
        combinedLoading,
        searchLoading,
        sendingNotifications,
        
        // Filters
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        activeFilter,
        setActiveFilter,
        resetFilters,
        clearSearch,
        handlePageChange,

        // Modal State
        showModal,
        showNotificationModal,
        showScheduleDetail,
        editingSchedule,
        openCreateModal,
        closeModal,
        handleEdit,
        handleShow,
        closeDetailModal,
        
        // Form State
        formData,
        errors,
        submitting,
        submitted,
        handleChange,
        handleSubmit,

        // Bulk Actions
        bulkDeleteMode,
        selectedSchedules,
        deleting,
        toggleBulkDeleteMode,
        handleSelectSchedule,
        handleSelectAll,
        handleBulkDelete,

        // Notifications
        handleSendNotifications,
        sendNotificationByType,
        closeNotificationModal,

        // Confirm Dialog
        confirmDialog,
    } = useScheduleManagement();

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8 sm:pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/20">
                                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            Manajemen Jadwal
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-600 ml-1">
                            Kelola jadwal inspeksi rutin APAR dan penugasan teknisi
                        </p>
                    </div>

                    <ScheduleActions
                        bulkDeleteMode={bulkDeleteMode}
                        selectedCount={selectedSchedules.length}
                        deleting={deleting}
                        sendingNotifications={sendingNotifications}
                        onBulkDelete={handleBulkDelete}
                        onToggleBulkDelete={toggleBulkDeleteMode}
                        onSendNotifications={handleSendNotifications}
                        onCreateNew={openCreateModal}
                    />
                </div>

                {/* Filters Section */}
                <ScheduleFilters
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                    activeFilter={activeFilter}
                    searchLoading={searchLoading}
                    onSearchChange={setSearchTerm}
                    onStatusChange={setStatusFilter}
                    onActiveChange={setActiveFilter}
                    onReset={resetFilters}
                    onClearSearch={clearSearch}
                />

                {/* Table Section */}
                <ScheduleTable
                    schedules={schedules}
                    pagination={pagination}
                    loading={combinedLoading}
                    onEdit={handleEdit}
                    onDelete={(id) => {
                        // Single delete uses the confirm dialog from the hook
                        // but we need to trigger it manually or expose a single delete handler
                        // For now, we'll use the bulk delete mechanism for single items if needed
                        // or better, add a single delete handler to the hook.
                        // Let's assume we add handleDelete(id) to the hook.
                        // Wait, the hook has handleBulkDelete but not handleSingleDelete exposed directly
                        // except via bulk delete logic.
                        // Let's use a temporary array for single delete via bulk logic or add it to hook.
                        // Actually, looking at the hook, it has deleteMutation but it's used inside handleBulkDelete.
                        // I should probably add a single delete handler to the hook for completeness.
                        // For now, I will implement a simple wrapper here or update the hook.
                        // Let's update the hook in the next step if needed, but for now let's use a direct call if possible
                        // or just use the bulk delete with one item.
                        // Actually, the hook exposes `confirmDialog` but not the delete mutation directly.
                        // I'll add handleDelete to the hook in a quick follow-up or just use bulk delete logic here.
                        // Let's use the bulk delete logic for now by selecting one and deleting.
                        // But that's clunky.
                        // Let's check the hook again. It has `deleteMutation` but it's not returned.
                        // I will update the hook to expose `handleDelete` for single item.
                        // For this file creation, I will assume `handleDelete` exists in the hook.
                        // I will update the hook immediately after this.
                        handleDelete(id);
                    }}
                    onView={handleShow}
                    onPageChange={handlePageChange}
                    onCreateNew={openCreateModal}
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                    activeFilter={activeFilter}
                    onResetFilters={resetFilters}
                    bulkDeleteMode={bulkDeleteMode}
                    selectedSchedules={selectedSchedules}
                    onSelectSchedule={handleSelectSchedule}
                    onSelectAll={handleSelectAll}
                />
            </div>

            {/* Modals */}
            <ScheduleModal
                isOpen={showModal}
                onClose={closeModal}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleChange}
                errors={errors}
                apars={apars}
                teknisi={teknisi}
                editingSchedule={editingSchedule}
                submitting={submitting}
                submitted={submitted}
            />

            <ScheduleDetailModal
                schedule={showScheduleDetail}
                isOpen={!!showScheduleDetail}
                onClose={closeDetailModal}
                onEdit={handleEdit}
            />

            <NotificationModal
                isOpen={showNotificationModal}
                onClose={closeNotificationModal}
                onSelectType={sendNotificationByType}
                sending={sendingNotifications}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.config.title}
                message={confirmDialog.config.message}
                type={confirmDialog.config.type}
                confirmText={confirmDialog.config.confirmText}
                cancelText={confirmDialog.config.cancelText}
                confirmButtonColor={confirmDialog.config.confirmButtonColor}
                onConfirm={confirmDialog.confirm}
                onCancel={confirmDialog.close}
            />
        </div>
    );
};

export default SchedulesManagement;
