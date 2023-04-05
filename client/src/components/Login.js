import React from 'react'
import { Button, Form, Input } from 'antd'
import { useNavigate } from 'react-router-dom'

const App: React.FC = () => {
  const navigate = useNavigate()
  const gotoSignUpPage = () => navigate('/register')

  const onFinish = (values: any) => {
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <div className='login__container'>
      <h2>Login </h2>

      <Form
        name='basic'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete='off'
      >
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
      </Form>
      <p>
        Don't have an account?{' '}
        <span className='link' onClick={gotoSignUpPage}>
          Sign up
        </span>
      </p>
    </div>
  )
}

export default App
