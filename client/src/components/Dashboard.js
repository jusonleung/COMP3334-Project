import React, { useState, useEffect } from 'react'
import { Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'
import { axiosInstance } from './AxiosInstance'
import SignOut from './SignOut'

const Dashboard = () => {
  const navigate = useNavigate()
  const gotoChangePasswordPage = () => navigate(configData.PATH.CHANGEPASSWORD)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    axiosInstance.get().then(res => {
      setEmail(res.data.email)
    })
  }, [])

  return (
    <Typography>
      {email ? (
        <div>
          Hi {email}!
          <br></br>
          <span className='link' onClick={gotoChangePasswordPage}>
            Change Password
          </span>
        </div>
      ) : (
        'Loading...'
      )}
      <SignOut />
    </Typography>
  )
}

export default Dashboard
