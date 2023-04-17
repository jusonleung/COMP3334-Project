import React from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'

const layout = {
  labelCol: {
    span: 8
  },
  wrapperCol: {
    span: 16
  }
}

const { Title } = Typography

const SignUp = () => {
  const navigate = useNavigate()
  const gotoLoginPage = () => navigate(configData.PATH.LOGIN)

  localStorage.clear()

  const onFinish = values => {
    let email = values.email
    let password = values.password
    let nickname = values.nickname
    fetch(configData.SERVER_URL + configData.PATH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        nickname
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
          alert(data.message)
          gotoLoginPage()
        }
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='signup__container'>
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
          name='nickname'
          label='Nickname'
          rules={[
            {
              required: true,
              message: 'Please input your nickname'
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
              pattern: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/,
              message:
                'Password must include at least one number, one lowercase letter, one uppercase letter, and one special character (!@#$%^&*)'
            },
            {
              pattern: /^.{8,30}$/,
              message: 'Password length must between 8 to 30'
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
              message: 'Please confirm your password'
            },
            ({ getFieldValue }) => ({
              validator (_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error('The two passwords that you entered do not match')
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
            Log in
          </span>
        </Form.Item>
      </Form>
    </div>
  )
}

export default SignUp
