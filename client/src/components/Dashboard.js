import React, { useState, useEffect } from 'react'
import { Typography, Button, Space, Col, Row } from 'antd'
import { useNavigate } from 'react-router-dom'
import configData from '../config.json'
import { axiosInstance } from './AxiosInstance'
import SignOut from './SignOut'
import Leaderboard from './Leaderboard'
import ChatRoom from './ChatRoom'
import { io } from 'socket.io-client'

const Dashboard = () => {
  const navigate = useNavigate()
  const gotoChangePasswordPage = () => navigate(configData.PATH.CHANGEPASSWORD)
  const gotoChangeNicknamePage = () => navigate(configData.PATH.CHANGENICKNAME)
  const [flag, setFlag] = useState(false)
  const [nickname, setNickname] = useState(null)
  const [coin, setCoin] = useState(null)
  const [level, setLevel] = useState(null)
  const chanceToGetCoin = configData.CHANCETOGETCOIN
  const coinsToLevelUp = configData.COINSTOLEVELUP

  const socket = io(configData.SERVER_URL, {
    secure: true,
    rejectUnauthorized: false,
    transportOptions: {
      polling: {
        extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    }
  })

  useEffect(() => {
    axiosInstance.get(configData.PATH.INFO).then(res => {
      setNickname(res.data.nickname)
      setCoin(res.data.coin)
      setLevel(res.data.level)
      setFlag(true)
    })
  }, [chanceToGetCoin])

  const getCoin = () => {
    axiosInstance.get(configData.PATH.GETCOIN).then(res => {
      setCoin(res.data.coin)
      alert(res.data.message)
    })
  }

  const levelUp = () => {
    axiosInstance.get(configData.PATH.LEVELUP).then(res => {
      setLevel(res.data.level)
      alert(res.data.message)
    })
  }

  return (
    <Typography className='dashboard'>
      {flag ? (
        <div>
          Hi {nickname}!<br />
          You are at level {level}, you have {coin} coins.
          <br />
          <Space>
            <div>
              You now have {chanceToGetCoin[level] * 100}% chance to get a coin.
            </div>
            <Button onClick={getCoin}> Try Get Coin</Button>
          </Space>
          <br />
          <br />
          {level < 5 && (
            <Space>
              <div>
                Use {coinsToLevelUp[level]} coins to level up, and you can get
                coins with a {chanceToGetCoin[level] * 100}% chance.
              </div>
              <Button onClick={levelUp}>Level Up</Button>
            </Space>
          )}
          <br />
          <br />
          <Row>
            <Col span={12}>
              <Leaderboard />
            </Col>
          </Row>
          <br />
          <ChatRoom socket={socket} />
          <br />
          <Space>
            <span className='link' onClick={gotoChangePasswordPage}>
              Change Password
            </span>
            <span className='link' onClick={gotoChangeNicknamePage}>
              Change Nickname
            </span>
          </Space>
          <br />
          <SignOut socket={socket}/>
        </div>
      ) : (
        'Loading...'
      )}
    </Typography>
  )
}

export default Dashboard
