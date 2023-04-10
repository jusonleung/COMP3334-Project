import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import configData from '../config.json'

const Activate = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const gotoDashboardPage = () => navigate(configData.PATH.DASHBOARD)

    fetch(configData.SERVER_URL + 'activate', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error_message) {
          alert(data.error_message)
        } else {
          alert(data.message)
          localStorage.setItem('token', data.token)
          gotoDashboardPage()
        }
      })
      .catch(err => console.error(err))
}

export default Activate
