export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const logout = () => {
  clearSession();
  window.location.replace('/');
};