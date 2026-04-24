export const getToken = () => localStorage.getItem('deertrack_token')
export const setToken = (t) => localStorage.setItem('deertrack_token', t)
export const removeToken = () => localStorage.removeItem('deertrack_token')
export const isLoggedIn = () => !!getToken()
