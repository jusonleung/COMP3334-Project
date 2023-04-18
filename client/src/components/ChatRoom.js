import React, { useState, useEffect } from 'react'

const ChatRoom = ({ socket }) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    socket.on('messageResponse', data => {
      setMessages(messages => {
        // Add the new data to the beginning of the array
        const updatedMessages = [...messages, data]
        // Limit the length of the array to 6
        if (updatedMessages.length > 6) updatedMessages.shift()
        return updatedMessages
      })
    })

    return () => {
      socket.off('messageResponse')
    }
  }, [socket])

  const handleSubmit = e => {
    e.preventDefault()
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
