const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const buildHeaders = (extraHeaders = {}, hasBody = false) => {
  const headers = { ...extraHeaders };
  if (hasBody) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  let body = null;

  try {
    if (contentType.includes('application/json')) body = await response.json();
    else body = await response.text();
  } catch (error) {
    body = null;
  }

  if (!response.ok) {
    const message = body && body.message
      ? body.message
      : (typeof body === 'string' && body) || response.statusText || 'Request failed';
    const err = new Error(message);
    err.status = response.status;
    err.payload = body;
    throw err;
  }

  return body;
};

export const request = async (path, options = {}) => {
  const { method = 'GET', body, headers } = options;
  const hasBody = typeof body !== 'undefined';
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(headers, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
};

export const get = (path) => request(path);
export const post = (path, body) => request(path, { method: 'POST', body });
export const put = (path, body) => request(path, { method: 'PUT', body });
export const patch = (path, body) => request(path, { method: 'PATCH', body });
export const remove = (path) => request(path, { method: 'DELETE' });

// Timetable / lecture helpers
export const getTeacherToday = () => get('/api/timetable/teacher/today');
export const getAdminTimetable = (opts = {}) => {
  const qs = opts.date ? `?date=${encodeURIComponent(opts.date)}` : '';
  return get(`/api/timetable/admin${qs}`);
};
export const substituteLecture = (sessionId, body) => patch(`/api/timetable/sessions/${sessionId}/substitute`, body);
export const getStudentTodayLectures = () => get('/api/timetable/student/my-lectures');
