import React from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import configData from '../config.json'
const { Title } = Typography

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const gotoLoginPage = () => navigate(configData.PATH.LOGIN)

  const onFinish = values => {
    const password = values.password
    fetch(configData.SERVER_URL + configData.PATH.RESETPASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        password
      })
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
    <div className='login__container'>
      <Form
        name='resetPw'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
        autoComplete='off'
      >
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Title level={2}>Reset Password</Title>
        </Form.Item>
        <Form.Item
          name='password'
          label='New Password'
          rules={[
            {
              required: true,
              message: 'Please enter your new password'
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
            },
            ({ getFieldValue }) => ({
              validator (_, value) {
                if (getFieldValue('oldPassword') === value) {
                  return Promise.reject(
                    new Error('New password can not same as the old password')
                  )
                } else {
                  return Promise.resolve()
                }
              }
            })
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name='confirm'
          label='Confirm New Password'
          dependencies={['password']}
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please confirm your new password'
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

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type='primary' htmlType='submit'>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ResetPassword
