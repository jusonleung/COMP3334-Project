import React, { useState, useEffect } from 'react'
import { Button, Form, Input, Slider, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'
import { axiosInstance } from './AxiosInstance'
import SignOut from './SignOut'

const Dashboard = () => {
  const navigate = useNavigate()
  const gotoLoginPage = () => navigate(configData.PATH.LOGIN)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    console.log('call api')
    axiosInstance.get().then(res => {
      setEmail(res.data.email)
    })
  }, [])

  return (
    <Typography>
      {email ? `Hi ${email}!` : 'Loading...'}
      <SignOut />
    </Typography>
  )
}

export default Dashboard
