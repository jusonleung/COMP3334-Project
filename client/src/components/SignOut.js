import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import configData from '../config.json'

const SignOut = ({socket}) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.clear()
    socket.close();
    navigate(configData.PATH.LOGIN)
  };

  return <Button onClick={handleSignOut}>Sign Out</Button>;
};

export default SignOut;
