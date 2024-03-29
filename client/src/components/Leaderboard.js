import { axiosInstance } from './AxiosInstance'
import React, { useState, useEffect } from 'react'
import { Table, Typography } from 'antd'
import configData from '../config.json'

const { Column } = Table
const { Title } = Typography

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState(null)
  const [rank, setRank] = useState(null)
  useEffect(() => {
    axiosInstance.get(configData.PATH.LEADERBOARD).then(res => {
      setLeaderboard(res.data.leaderboard)
      setRank(res.data.rank)
    })
  }, [])

  return (
    <div>
      <Title level={5}>Leaderboard</Title>
      <Table dataSource={leaderboard} pagination={false}>
        <Column title='Rank' dataIndex='rank' key='rank' />
        <Column title='Name' dataIndex='nickname' key='nickname' />
        <Column title='Level' dataIndex='level' key='level' />
        <Column title='Coin' dataIndex='coin' key='coin' />
      </Table>
      <Typography>You are at rank {rank}</Typography>
    </div>
  )
}

export default Leaderboard
