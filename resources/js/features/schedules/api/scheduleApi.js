/**
 * Schedule API Functions
 * Centralized API calls for schedule management
 */

/**
 * Fetch schedules with pagination and filters
 * @param {Object} apiClient - Axios instance from useAuth
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const fetchSchedules = async (apiClient, params) => {
    const response = await apiClient.get("/api/schedules", { params });
    return response.data;
};

/**
 * Fetch all APARs
 * @param {Object} apiClient - Axios instance from useAuth
 * @returns {Promise} API response
 */
export const fetchApars = async (apiClient) => {
    const response = await apiClient.get("/api/apar");
    return response.data;
};

/**
 * Fetch all users
 * @param {Object} apiClient - Axios instance from useAuth
 * @returns {Promise} API response
 */
export const fetchUsers = async (apiClient) => {
    const response = await apiClient.get("/api/users");
    return response.data;
};

/**
 * Create a new schedule
 * @param {Object} apiClient - Axios instance from useAuth
 * @param {Object} payload - Schedule data
 * @returns {Promise} API response
 */
export const createSchedule = async (apiClient, payload) => {
    const response = await apiClient.post("/api/schedules", payload);
    return response.data;
};

/**
 * Update an existing schedule
 * @param {Object} apiClient - Axios instance from useAuth
 * @param {number} id - Schedule ID
 * @param {Object} payload - Updated schedule data
 * @returns {Promise} API response
 */
export const updateSchedule = async (apiClient, id, payload) => {
    const response = await apiClient.put(`/api/schedules/${id}`, payload);
    return response.data;
};

/**
 * Delete a schedule
 * @param {Object} apiClient - Axios instance from useAuth
 * @param {number} id - Schedule ID
 * @returns {Promise} API response
 */
export const deleteSchedule = async (apiClient, id) => {
    const response = await apiClient.delete(`/api/schedules/${id}`);
    return response.data;
};

/**
 * Send bulk notifications
 * @param {Object} apiClient - Axios instance from useAuth
 * @param {string} endpoint - Notification endpoint
 * @returns {Promise} API response
 */
export const sendNotifications = async (apiClient, endpoint) => {
    const response = await apiClient.post(endpoint);
    return response.data;
};
