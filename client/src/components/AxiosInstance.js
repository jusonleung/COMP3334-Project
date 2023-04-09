import axios from 'axios'
import configData from '../config.json'

const axiosInstance = axios.create({
  baseURL: configData.SERVER_URL,
  headers: {
    Authorization: localStorage.getItem('token')
  }
})

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    localStorage.clear()
    window.location.href = '/login'

    return Promise.reject(error)
  }
)

// Set the AUTH token for any request
axiosInstance.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  config.headers.Authorization = token ? `Bearer ${token}` : ''
  return config
})
export { axiosInstance }
