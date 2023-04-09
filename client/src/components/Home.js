import React from 'react'
import { Navigate } from 'react-router-dom'
import configData from "../config.json";

const Home = () => {
  const token = localStorage.getItem('token')
    return token? <Navigate to={configData.PATH.DASHBOARD} /> : <Navigate to={configData.PATH.LOGIN} />
}

export default Home
