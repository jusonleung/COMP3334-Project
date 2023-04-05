import React from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const layout = {
  labelCol: {
    span: 8
  },
  wrapperCol: {
    span: 16
  }
}

const { Title } = Typography

const Signup = () => {
  const navigate = useNavigate()
  const gotoLoginPage = () => navigate('/')

  const onFinish = (values: any) => {
    console.log('Success:', values)
  }

  return (
    <div className='login__container'>
      <Form
        {...layout}
        name='sign-up'
        onFinish={onFinish}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
      >
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
          <Title level={2}>Sign Up </Title>
        </Form.Item>

        <Form.Item
          name='username'
          label='Username'
          rules={[
            {
              required: true,
              message: 'Please input your username'
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='email'
          label='Email'
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
          name='password'
          label='Password'
          rules={[
            {
              required: true,
              type: 'password'
            },
            {
              pattern: /^[a-zA-Z0-9!@#$%^&*]/,
              message:
                'Password can only include lowercase letter, uppercase letter, and special character (!@#$%^&*)'
            },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/,
              message:
                'Password must include at least one lowercase letter, one uppercase letter, and one special character (!@#$%^&*)'
            },
            {
              pattern: /^.{8,50}$/,
              message: 'Password length must more than 8'
            }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name='confirm'
          label='Confirm Password'
          dependencies={['password']}
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please confirm your password!'
            },
            ({ getFieldValue }) => ({
              validator (_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error('The two passwords that you entered do not match!')
                )
              }
            })
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
          <Button type='primary' htmlType='submit'>
            Sign In
          </Button>
        </Form.Item>

        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
          Already have an account?{' '}
          <span className='link' onClick={gotoLoginPage}>
            Sign up
          </span>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Signup
