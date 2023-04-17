import React, { useState, useEffect } from 'react'

const ChatRoom = ({ socket }) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    socket.on('messageResponse', data => {
      setMessages(messages => [...messages, data])
    })

    return () => {
      socket.off('messageResponse')
    }
  }, [socket])

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('message', `${message}`)
      setMessage('')
    }
  }

  return (
    <div>
      <h1>Public Chatroom</h1>
      <div>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            value={message}
            onChange={event => setMessage(event.target.value)}
          />
          <button type='submit'>Send</button>
        </form>
      </div>
    </div>
  )
}

export default ChatRoom
