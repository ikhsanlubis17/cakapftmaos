/**
 * Schedule Utility Functions
 * Pure helper functions for schedule management
 */

/**
 * Convert frequency code to Indonesian text
 * @param {string} frequency - Frequency code
 * @returns {string} Indonesian frequency text
 */
export const getFrequencyText = (frequency) => {
    switch (frequency) {
        case "weekly":
            return "Perminggu";
        case "monthly":
            return "Perbulan";
        case "quarterly":
            return "Per-3 Bulan";
        case "semiannual":
            return "Per-6 Bulan";
        default:
            return frequency;
    }
};

/**
 * Check if schedule is overdue
 * @param {Object} schedule - Schedule object
 * @returns {boolean} True if overdue
 */
export const isScheduleOverdue = (schedule) => {
    const now = new Date();
    const scheduledDate = schedule.scheduled_date.split("T")[0];
    const scheduledDateTime = new Date(
        `${scheduledDate}T${schedule.start_time}`
    );
    return scheduledDateTime < now;
};

/**
 * Check if schedule is today
 * @param {Object} schedule - Schedule object
 * @returns {boolean} True if today
 */
export const isScheduleToday = (schedule) => {
    const now = new Date();
    const scheduledDate = schedule.scheduled_date.split("T")[0];
    const today = now.toISOString().split("T")[0];
    return scheduledDate === today;
};

/**
 * Check if schedule is currently ongoing
 * @param {Object} schedule - Schedule object
 * @returns {boolean} True if ongoing
 */
export const isScheduleOngoing = (schedule) => {
    const now = new Date();
    const scheduledDate = schedule.scheduled_date.split("T")[0];
    const scheduledDateTime = new Date(
        `${scheduledDate}T${schedule.start_time}`
    );
    const scheduledEndDateTime = new Date(
        `${scheduledDate}T${schedule.end_time}`
    );
    return now >= scheduledDateTime && now <= scheduledEndDateTime;
};

/**
 * Get status color classes for schedule
 * @param {Object} schedule - Schedule object
 * @returns {string} Tailwind CSS classes
 */
export const getStatusColor = (schedule) => {
    const now = new Date();
    const scheduledDate = schedule.scheduled_date.split("T")[0];
    const scheduledDateTime = new Date(
        `${scheduledDate}T${schedule.start_time}`
    );
    const scheduledEndDateTime = new Date(
        `${scheduledDate}T${schedule.end_time}`
    );

    if (!schedule.is_active) {
        return "bg-gray-100 text-gray-700";
    }

    // Priority order: today_ongoing > today_not_started > overdue > upcoming

    // Check if schedule is today and ongoing (within time window) - HIGHEST PRIORITY
    if (
        scheduledDate === now.toISOString().split("T")[0] &&
        now >= scheduledDateTime &&
        now <= scheduledEndDateTime
    ) {
        return "bg-amber-100 text-amber-700";
    }

    // Check if schedule is today but not started yet - SECOND PRIORITY
    if (
        scheduledDate === now.toISOString().split("T")[0] &&
        now < scheduledDateTime
    ) {
        return "bg-blue-100 text-blue-700";
    }

    // Check if schedule is overdue (past start time) - THIRD PRIORITY
    if (scheduledDateTime < now) {
        return "bg-red-100 text-red-700";
    }

    // Future schedule - LOWEST PRIORITY
    return "bg-emerald-100 text-emerald-700";
};

/**
 * Get status text for schedule
 * @param {Object} schedule - Schedule object
 * @returns {string} Status text in Indonesian
 */
export const getStatusText = (schedule) => {
    const now = new Date();
    const scheduledDate = schedule.scheduled_date.split("T")[0];
    const startTime = schedule.start_time || "00:00:00";
    const endTime = schedule.end_time || "23:59:59";
    const scheduledDateTime = new Date(`${scheduledDate}T${startTime}`);
    const scheduledEndDateTime = new Date(`${scheduledDate}T${endTime}`);

    if (!schedule.is_active) {
        return "Nonaktif";
    }

    // Priority order: today_ongoing > today_not_started > overdue > upcoming

    // Check if schedule is today and ongoing (within time window) - HIGHEST PRIORITY
    if (now >= scheduledDateTime && now <= scheduledEndDateTime) {
        return "Hari ini (sedang berlangsung)";
    }

    // Check if schedule is today but not started yet - SECOND PRIORITY
    if (
        scheduledDate === now.toISOString().split("T")[0] &&
        now < scheduledDateTime
    ) {
        return "Hari ini (belum dimulai)";
    }

    // Check if schedule is overdue (past start time) - THIRD PRIORITY
    if (scheduledDateTime < now) {
        return "Terlambat";
    }

    // Future schedule - LOWEST PRIORITY
    return "Akan datang";
};

/**
 * Get status icon component for schedule
 * @param {Object} schedule - Schedule object
 * @param {Object} icons - Icon components object
 * @returns {Component} Icon component
 */
export const getStatusIcon = (schedule, icons) => {
    const {
        XCircleIcon,
        ClockIcon,
        CalendarIcon,
        ExclamationTriangleIcon,
        CheckCircleIcon,
    } = icons;

    const now = new Date();
    const scheduledDate = schedule.scheduled_date.split("T")[0];
    const scheduledDateTime = new Date(
        `${scheduledDate}T${schedule.start_time}`
    );
    const scheduledEndDateTime = new Date(
        `${scheduledDate}T${schedule.end_time}`
    );

    if (!schedule.is_active) {
        return XCircleIcon;
    }

    // Priority order: today_ongoing > today_not_started > overdue > upcoming

    // Check if schedule is today and ongoing (within time window) - HIGHEST PRIORITY
    if (
        scheduledDate === now.toISOString().split("T")[0] &&
        now >= scheduledDateTime &&
        now <= scheduledEndDateTime
    ) {
        return ClockIcon;
    }

    // Check if schedule is today but not started yet - SECOND PRIORITY
    if (
        scheduledDate === now.toISOString().split("T")[0] &&
        now < scheduledDateTime
    ) {
        return CalendarIcon;
    }

    // Check if schedule is overdue (past start time) - THIRD PRIORITY
    if (scheduledDateTime < now) {
        return ExclamationTriangleIcon;
    }

    // Future schedule - LOWEST PRIORITY
    return CheckCircleIcon;
};

/**
 * Validate schedule form data
 * @param {Object} formData - Form data to validate
 * @param {Array} teknisi - List of technicians
 * @param {Object|null} editingSchedule - Schedule being edited (null for create)
 * @returns {Object} Validation errors object
 */
export const validateScheduleForm = (formData, teknisi, editingSchedule) => {
    const newErrors = {};

    if (!formData.apar_id || formData.apar_id === "") {
        newErrors.apar_id = "APAR wajib dipilih";
    }

    if (!formData.assigned_user_id || formData.assigned_user_id === "") {
        newErrors.assigned_user_id = "Teknisi wajib dipilih";
    } else {
        const selectedUser = teknisi.find(
            (user) => user.id == formData.assigned_user_id
        );
        if (!selectedUser) {
            newErrors.assigned_user_id = "Teknisi yang dipilih tidak ditemukan";
        } else if (selectedUser.role !== "teknisi") {
            newErrors.assigned_user_id =
                "User yang dipilih harus berperan sebagai teknisi";
        } else if (!selectedUser.email) {
            newErrors.assigned_user_id =
                "Teknisi yang dipilih harus memiliki email";
        }
    }

    if (!formData.scheduled_date || formData.scheduled_date === "") {
        newErrors.scheduled_date = "Tanggal wajib diisi";
    } else {
        if (!editingSchedule) {
            const selectedDate = new Date(formData.scheduled_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.scheduled_date = "Tanggal tidak boleh di masa lalu";
            }
        }
    }

    if (!formData.start_time || formData.start_time === "") {
        newErrors.start_time = "Waktu mulai wajib diisi";
    }

    if (!formData.end_time || formData.end_time === "") {
        newErrors.end_time = "Batas waktu wajib diisi";
    }

    if (
        !formData.frequency ||
        !["weekly", "monthly", "quarterly", "semiannual"].includes(
            formData.frequency
        )
    ) {
        newErrors.frequency = "Frekuensi wajib dipilih";
    }

    return newErrors;
};
