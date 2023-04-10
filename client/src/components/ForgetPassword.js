import React from 'react'
import { Button, Form, Input, Typography } from 'antd'
import configData from '../config.json'
const { Title } = Typography

const ForgetPassword = () => {

  const onFinish = values => {
    const email = values.email
    fetch(configData.SERVER_URL + 'forgetPw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email
      })
    })
    alert('If your email is correct, you will receive a password reset link in your in box')
  }

  return (
    <div className='login__container'>
      <Form
        name='login'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
        autoComplete='off'
      >
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Title level={2}>Forget Password</Title>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          Pleas enter your email
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
              message: 'Please enter your Email'
            }
          ]}
        >
          <Input />
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

export default ForgetPassword
