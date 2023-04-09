import React, { useEffect } from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'

const { Title } = Typography

const Login = () => {
  const navigate = useNavigate()
  const gotoSignUpPage = () => navigate(configData.PATH.REGISTER)
  const gotoDashboardPage = () => navigate(configData.PATH.DASHBOARD)

  useEffect(() => {
    console.log('redirect to dashboard')
    if (localStorage.getItem('token') !== null) {
      gotoDashboardPage()
    }
  })

  const onFinish = values => {
    let email = values.email
    let password = values.password
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
          localStorage.setItem('token', data.token)
          gotoDashboardPage()
        }
      })
      .catch(err => console.error(err))
    //console.log('Success:', values.email, values.password)
  }

  return (
    <div className='login__container'>
      <Form
        name='basic'
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
    </div>
  )
}

export default Login
