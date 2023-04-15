import React, { useEffect } from 'react'
import { Button, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'
import { axiosInstance } from './AxiosInstance'

const { Title } = Typography

const ChangeNickname = () => {
  const navigate = useNavigate()
  const gotoDashboardPage = () => navigate(configData.PATH.DASHBOARD)

  useEffect(() => {
    axiosInstance.get('getInfo')
  }, [])

  const onFinish = values => {
    const nickname = values.nickname
    const token = localStorage.getItem('token')
    fetch(configData.SERVER_URL + 'changeNickname', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nickname
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message)
        gotoDashboardPage()
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='login__container'>
      <Form
        name='changeNickname'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
        autoComplete='off'
      >
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Title level={2}>Change Nickname</Title>
        </Form.Item>

        <Form.Item
          label='New Nickname'
          name='nickname'
          rules={[
            { required: true, message: 'Please enter your new nickname' }
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

export default ChangeNickname
