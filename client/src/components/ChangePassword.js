import React, { useEffect } from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'
import { axiosInstance } from './AxiosInstance'

const { Title } = Typography

const ChangePassword = () => {
  const navigate = useNavigate()
  const gotoDashboardPage = () => navigate(configData.PATH.DASHBOARD)

  useEffect(() => {
    axiosInstance.get('getInfo')
  }, [])

  const onFinish = values => {
    const oldPassword = values.oldPassword
    const newPassword = values.newPassword
    const token = localStorage.getItem('token')

    fetch(configData.SERVER_URL + 'changePw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword,
        newPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error_message) {
          alert(data.error_message)
        } else {
          alert(data.message)
          gotoDashboardPage()
        }
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='login__container'>
      <Form
        name='changePw'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
        autoComplete='off'
      >
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Title level={2}>Change Password</Title>
        </Form.Item>

        <Form.Item
          label='Old Password'
          name='oldPassword'
          rules={[
            { required: true, message: 'Please enter your old password' }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name='newPassword'
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
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please confirm your new password'
            },
            ({ getFieldValue }) => ({
              validator (_, value) {
                if (!value || getFieldValue('newPassword') === value) {
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

export default ChangePassword
