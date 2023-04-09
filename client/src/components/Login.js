import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'

const { Title } = Typography

const Login = () => {
  const navigate = useNavigate()
  const gotoSignUpPage = () => navigate(configData.PATH.REGISTER)
  const gotoDashboardPage = () => navigate(configData.PATH.DASHBOARD)
  const [show2faForm, setShow2faForm] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    if (localStorage.getItem('token') !== null) {
      gotoDashboardPage()
    }
  })

  const onFinish = values => {
    const email = values.email
    const password = values.password
    fetch(configData.SERVER_URL + 'login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error_message) {
          alert(data.error_message)
        } else {
          setToken(data.token)
          setShow2faForm(true)
          //localStorage.setItem('token', data.token)
          //gotoDashboardPage()
        }
      })
      .catch(err => console.error(err))
    //console.log('Success:', values.email, values.password)
  }

  const on2faFinish = values => {
    // submit the 2FA code and get the JWT token
    const OTP = values.OTP
    fetch(configData.SERVER_URL + 'login/2fa', {
      method: 'POST',
      body: JSON.stringify({
        
        OTP: OTP
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error_message) {
          alert(data.error_message)
        } else {
          localStorage.setItem('token', data.token)
          gotoDashboardPage()
        }
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='login__container'>
      {!show2faForm && (
        <Form
          name='login'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete='off'
        >
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Title level={2}>Login</Title>
          </Form.Item>

          <Form.Item
            label='Email'
            name='email'
            rules={[
              {
                type: 'email',
                message: 'The input is not valid Email'
              },
              {
                required: true,
                message: 'Please input your Email'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label='Password'
            name='password'
            rules={[{ required: true, message: 'Please input your password' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type='primary' htmlType='submit'>
              Sign in
            </Button>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            Don't have an account?{' '}
            <span className='link' onClick={gotoSignUpPage}>
              Sign up
            </span>
          </Form.Item>
        </Form>
      )}
      {show2faForm && (
        <Form
          name='2fa'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          onFinish={on2faFinish}
          autoComplete='off'
        >
          <Title level={2}>Two-Factor Authentication</Title>
          <Form.Item name='OTP' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Typography>
            A verification code is sent to your email, please enter the code to
            continue
          </Typography>
          <Form.Item>
            <Button type='primary' htmlType='submit'>
              Submit
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  )
}

export default Login
