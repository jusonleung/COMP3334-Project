import React from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'

const { Title } = Typography

const TwoFA = props => {
  const navigate = useNavigate()

  const onFinish = values => {
    // submit the 2FA code and get the JWT token
    const OTP = values.OTP
    fetch(configData.SERVER_URL + props.API + configData.PATH['2FA'], {
      method: 'POST',
      body: JSON.stringify({
        OTP: OTP
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('2faToken')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error_message) {
          alert(data.error_message)
        } else {
          localStorage.removeItem('2faToken')
          localStorage.setItem('token', data.token)
          navigate(props.navigateTo)
        }
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='login__container'>
      <Form
        name='2fa'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
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
    </div>
  )
}

export default TwoFA