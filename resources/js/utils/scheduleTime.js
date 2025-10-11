export const getScheduleWindow = (schedule) => {
    if (!schedule) {
        return { start: null, end: null };
    }

    const toDate = (value) => {
        if (!value) {
            return null;
        }

        const dateValue = value instanceof Date ? value : new Date(value);
        return isNaN(dateValue.getTime()) ? null : dateValue;
    };

    let start = toDate(schedule.start_at || schedule.startAt || schedule.startAtUtc);
    let end = toDate(schedule.end_at || schedule.endAt || schedule.endAtUtc);

    if (!start && schedule.scheduled_date) {
        const datePart = schedule.scheduled_date.split('T')[0];
        const timePart = schedule.start_time || schedule.scheduled_time || '00:00:00';
        start = toDate(`${datePart}T${timePart}`);
    }

    if (!end) {
        if (schedule.end_time) {
            const datePart = (schedule.scheduled_date || '').split('T')[0];
            const timePart = schedule.end_time;
            end = toDate(`${datePart}T${timePart}`);
        } else if (start) {
            end = new Date(start.getTime() + 60 * 60 * 1000);
        }
    }

    return { start, end };
};

export const formatScheduleDate = (schedule, locale = 'id-ID', options) => {
    const { start } = getScheduleWindow(schedule);

    if (!start) {
        return '-';
    }

    const defaultOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return start.toLocaleDateString(locale, options || defaultOptions);
};

export const formatScheduleTime = (schedule, locale = 'id-ID', options) => {
    const { start, end } = getScheduleWindow(schedule);

    if (!start) {
        return '-';
    }

    const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };

    const startStr = start.toLocaleTimeString(locale, options || defaultOptions);
    const endStr = end ? end.toLocaleTimeString(locale, options || defaultOptions) : null;

    return endStr ? `${startStr} - ${endStr}` : startStr;
};

export const getDaysUntilSchedule = (schedule) => {
    const { start } = getScheduleWindow(schedule);

    if (!start) {
        return 'Tanggal tidak valid';
    }

    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `${Math.abs(diffDays)} hari yang lalu`;
    }

    if (diffDays === 0) {
        if (start < now) {
            return 'Hari ini (terlambat)';
        }

        return 'Hari ini';
    }

    if (diffDays === 1) {
        const sameDay = start.toDateString() === now.toDateString();
        return sameDay ? 'Hari ini' : 'Besok';
    }

    return `${diffDays} hari lagi`;
};
