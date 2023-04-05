import React from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography

const Login: React.FC = () => {
  const navigate = useNavigate()
  const gotoSignUpPage = () => navigate('/register')

  const onFinish = (values: any) => {
    console.log('Success:', values)
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
          label='Username'
          name='username'
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label='Password'
          name='password'
          rules={[{ required: true, message: 'Please input your password!' }]}
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
