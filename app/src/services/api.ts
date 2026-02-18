import axios from 'axios'
import { tokenHandler } from './token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenHandler.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh Token INTERCEPTOR
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config
//     if (error.response?.status === 401) {
//       originalRequest._retry = true

//       try {
//         const newToken = await tokenHandler.refreshToken()
//         tokenHandler.setToken(newToken)
//         originalRequest.headers.Authorization = `Bearer ${newToken}`

//         return api(originalRequest)
//       } catch (error) {
//         // LOGOUT
//         tokenHandler.clearToken()
//         window.location.href = '/'
//         return Promise.reject(error)
//       }
//     }
//     return Promise.reject(error)
//   }
// )
