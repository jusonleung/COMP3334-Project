import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'
import TwoFA from './Twofa'

const { Title } = Typography

const Login = () => {
  const navigate = useNavigate()
  const gotoSignUpPage = () => navigate(configData.PATH.REGISTER)
  const gotoDashboardPage = () => navigate(configData.PATH.DASHBOARD)
  const gotoForgetPwPage = () => navigate(configData.PATH.FORGETPASSWORD)
  const [show2faForm, setShow2faForm] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token') !== null) {
      gotoDashboardPage()
    }
  })

  const onFinish = values => {
    const email = values.email
    const password = values.password
    fetch(configData.SERVER_URL + configData.PATH.LOGIN, {
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
          //setToken(data.token)
          setShow2faForm(true)
          localStorage.setItem('2faToken', data.token)
          //gotoDashboardPage()
        }
      })
      .catch(err => console.error(err))
    //console.log('Success:', values.email, values.password)
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
                message: 'It is not valid Email'
              },
              {
                required: true,
                message: 'Please enter your Email'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label='Password'
            name='password'
            rules={[{ required: true, message: 'Please enter your password' }]}
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

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <span className='link' onClick={gotoForgetPwPage}>
              Forget password?
            </span>
          </Form.Item>
        </Form>
      )}
      {show2faForm && (
        <TwoFA API={configData.PATH.LOGIN} navigateTo={configData.PATH.DASHBOARD} />
      )}
    </div>
  )
}

export default Login
