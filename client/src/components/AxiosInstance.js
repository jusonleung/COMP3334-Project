import axios from 'axios'
import configData from '../config.json'

const axiosInstance = axios.create({
  baseURL: configData.SERVER_URL
})

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.clear()
      //alert(error)
      window.location.href = '/login'
      return Promise.reject(error)
    }
  }
)

// Set the AUTH token for any request
axiosInstance.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  config.headers.Authorization = token ? `Bearer ${token}` : ''
  return config
})
export { axiosInstance }
