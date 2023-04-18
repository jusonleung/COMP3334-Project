require('dotenv').config()
const https = require('https')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const router = express.Router()
const app = express()
const Joi = require('joi')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
const crypto = require('crypto')
const { Novu } = require('@novu/node')
const jwt = require('jsonwebtoken')
const sql = require('mssql/msnodesqlv8')

const options = {
  key: fs.readFileSync('key'),
  cert: fs.readFileSync('cert')
}
const server = https.createServer(options, app)

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
})
const PORT = 4000
const MAX_INVALID_ATTEMPT = 3
const SECRET_KEY =
  'c6599d14324d6a3c011209e5317bfec8eb4506be0bf03a5b8c07d1e7fab9a6a974686bc0662fdcf5c900d79035fbcc124559d0d89a45d80b11e2ca2e10a41373'

const novu = new Novu(process.env.NOVU_API_KEY)
const chanceToGetCoin = [0.1, 0.15, 0.25, 0.4, 0.65, 1]
const coinsToLevelUp = [5, 10, 30, 80, 200]

//Create a MSSQL connection pool
const pool = new sql.ConnectionPool({
  database: 'COMP3334',
  server: 'localhost',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true
  }
})

/* //Create a MSSQL connection pool
const pool = new sql.ConnectionPool({
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  server:process.env.DB_SERVER,   //這邊要注意一下!!
  database:process.env.DB_DATABASE
}) */

const poolConnect = pool.connect()
poolConnect
  .then(() => {
    console.log('Connected to MSSQL server')
  })
  .catch(err => {
    console.error('Failed to connect to MSSQL server', err)
  })

const getUserByEmail = async email => {
  try {
    await poolConnect

    const request = new sql.Request(pool)
    request.input('Email', sql.VarChar(50), email)

    const result = await request.query(
      `SELECT * FROM [dbo].[User] WHERE [Email] = @Email`
    )

    if (result.recordset.length === 0) {
      console.log('No user found with the provided email')
      return null
    }

    return result.recordset[0]
  } catch (err) {
    console.error('Failed to connect to MSSQL server', err)
    throw err
  }
}

let OTPs = []

const generateRandomNumber = () => {
  const randomNumber = Math.floor(Math.random() * 10000) // generates a random number between 0 and 999999
  return randomNumber.toString().padStart(4, '0') // ensures the string is always 6 digits long
}

const hash = str => {
  const hash = crypto.createHash('sha256')
  hash.update(str)
  return hash.digest('hex')
}

const passwordSchema = Joi.string()
  .min(8)
  .max(30)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).+$'))
  .required()

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema
})

router.use(express.urlencoded({ extended: true }))
router.use(express.json())
router.use(cors())

const generateToken = (email, state) => {
  return jwt.sign({ email: email, state: state }, SECRET_KEY, {
    expiresIn: '1h'
  })
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(401).json(err)
    req.user = user
    next()
  })
}

const authenticateUser = async (req, res, next) => {
  let user = await getUserByEmail(req.user.email)
  if (req.user.state !== 'verified' || !user) return res.status(401)
  req.user = user
  next()
}

router.get('/', authenticateToken, authenticateUser, (req, res) => {
  res.json({ message: 'Hello world' })
})

/********
Info
*********/
router.get('/info', authenticateToken, authenticateUser, (req, res) => {
  res.json({
    nickname: req.user.nickname,
    coin: req.user.coin,
    level: req.user.level
  })
})

/********
Resgister
*********/
router.post('/register', async (req, res) => {
  //Get the user's credentials
  const { email, password, nickname } = req.body

  const validateResult = registerSchema.validate({ email, password })
  if (validateResult.error) {
    return res.status(400).json({
      error_message: validateResult.error.message
    })
  }

  //Checks if there is an existing user with the same email or password
  const result = await getUserByEmail(email)

  //Runs if a user exists
  if (result) {
    return res.status(400).json({
      error_message: 'This email is already registered'
    })
  }
  //creates the structure for the user
  salt = generateRandomNumber()
  // Insert data into the "User" table
  poolConnect
    .then(() => {
      const request = new sql.Request(pool)
      request
        .input('Email', sql.VarChar(50), email)
        .input('Nickname', sql.VarChar(50), nickname)
        .input('Salt', sql.NChar(4), salt)
        .input('Password', sql.Char(64), hash(salt + password))
        .input('Activate', sql.Bit, false)
        .input('Lock', sql.Bit, false)
        .input('InvalidAttempt', sql.Int, 0)
        .input('Coin', sql.Int, 0)
        .input('Level', sql.Int, 0)
        .query(
          `INSERT INTO [dbo].[User] ([Email], [Nickname], [Salt], [Password], [Activate], [Lock] ,[InvalidAttempt], [Coin], [Level])
            VALUES (@Email, @Nickname, @Salt, @Password, @Activate, @Lock, @InvalidAttempt, @Coin, @Level)`,
          (err, result) => {
            if (err) {
              console.error('Failed to execute SQL query', err)
              return
            }
            console.log('Data inserted successfully')
          }
        )
    })
    .catch(err => {
      console.error('Failed to connect to MSSQL server', err)
    })

  //Send Activation Email
  sendActivationEmail(email)
  //Returns a message
  res.json({
    message: 'An activation email has been sent to you\nplease check your inbox'
  })
})

const sendActivationEmail = async (email, locked) => {
  try {
    console.log(email)
    const token = generateToken(email, 'activate')
    let response = await novu.trigger('activation-email', {
      to: {
        subscriberId: email,
        email: email
      },
      payload: {
        action: locked ? 'unlock' : 'activate',
        link: `http://localhost:3000/activate?token=${token}`
      }
    })
    console.log(
      `To ${email}: Click this link to ${
        locked ? 'unlock' : 'activate'
      } your email\nhttp://localhost:3000/activate?token=${token}`
    )
    //console.log(response)
  } catch (err) {
    console.error(err)
  }
}

/********
Login
*********/
router.post('/login', async (req, res) => {
  //Accepts the user's credentials
  const { email, password } = req.body
  //Checks for user(s) with the same email and password

  result = await getUserByEmail(email)

  //If no user exists
  if (!result) {
    return res.status(400).json({
      error_message: 'This email is not registered'
    })
  }

  //If account is not activated
  if (!result.activate) {
    sendActivationEmail(result.email)
    return res.status(400).json({
      error_message:
        'This account is not activated\nAn activation email has been sent to you\nplease check your inbox'
    })
  }

  //If account is locked
  if (result.lock) {
    sendActivationEmail(result.email, true)
    return res.status(400).json({
      error_message:
        'This account is temporarily locked\nTo unlock, please check you email'
    })
  }

  //If wrong password
  if (hash(result.salt + password) !== result.password) {
    result.invalidAttempt++
    try {
      await poolConnect

      const request = new sql.Request(pool)

      // Update user's lock status

      request.input('invalidAttempt', sql.Int, result.invalidAttempt) // Set invalidAttempt++
      request.input('Email', sql.VarChar(50), email) // Specify the email of the user to update
      await request.query(`UPDATE [dbo].[User]
                           SET [invalidAttempt] = @invalidAttempt
                           WHERE [Email] = @Email`)
      console.log(`User with email ${email} invalidAttempt updated successfully`)
    } catch (err) {
      console.error('Failed to connect to MSSQL server', err)
    }
    if (result.invalidAttempt > MAX_INVALID_ATTEMPT) {
      try {
        await poolConnect

        const request = new sql.Request(pool)

        // Update user's lock status

        request.input('Lock', sql.Bit, false) // Set Lock = false
        request.input('Email', sql.VarChar(50), email) // Specify the email of the user to update
        await request.query(`UPDATE [dbo].[User]
                             SET [Lock] = @Lock
                             WHERE [Email] = @Email`)
        console.log(`User with email ${email} lock status updated successfully`)
      } catch (err) {
        console.error('Failed to connect to MSSQL server', err)
      }

      sendActivationEmail(email, true)
      return res.status(400).json({
        error_message: `Multiple invalid logins, the account is temporarily locked\nTo unlock, please check you email`
      })
    }
    return res.status(400).json({
      error_message: 'Invalid password, Attempt:' + result.invalidAttempt
    })
  }
  sendOTP(email)
  //Returns a token after a successful login
  const token = generateToken(email, 'login')
  res.json({
    message: 'Please enter the OTP that sent to your email',
    token: token
  })
})

/********
activate
*********/
router.get('/activate', authenticateToken, async (req, res) => {
  let user = await getUserByEmail(req.user.email)
  if (req.user.state !== 'activate' || !user) return res.status(401)

  try {
    await poolConnect

    const request = new sql.Request(pool)

    request.input('Lock', sql.Bit, false) // Update Lock to false
    request.input('Activate', sql.Bit, true) // Update Activate to true
    request.input('InvalidAttempt', sql.Int, 0) // Update InvalidAttempt to 0
    request.input('Email', sql.VarChar(50), req.user.email) // Specify the email of the user to update
    await request.query(`UPDATE [dbo].[User]
                                          SET [Lock] = @Lock,
                                              [Activate] = @Activate,
                                              [InvalidAttempt] = @InvalidAttempt
                                          WHERE [Email] = @Email`)
    console.log(`User with email ${req.user.email} updated successfully`)
  } catch (err) {
    console.error('Failed to connect to MSSQL server', err)
  }

  res.json({
    message: `Your account ${user.email} is ${
      user.lock ? 'unlocked' : 'activated'
    }`
  })
})

const sendOTP = async email => {
  try {
    OTPs = OTPs.filter(otp => otp.email !== email)
    const OTP = generateRandomNumber()
    let response = await novu.trigger('OTP', {
      to: {
        subscriberId: email,
        email: email
      },
      payload: {
        OTP: OTP
      }
    })
    console.log(`To ${email}: Your verification code is ${OTP}`)
    const newOTP = {
      email: email,
      OTP: OTP,
      expireTime: Date.now() + 60000 // set the expire time to 1 minute from now
    }
    OTPs.push(newOTP)
    //console.log(response)
  } catch (err) {
    console.error(err)
  }
}

// Function to check and remove expired OTPs
const checkExpiredOTPs = () => {
  const currentTime = Date.now()
  for (let i = OTPs.length - 1; i >= 0; i--) {
    const { expireTime } = OTPs[i]
    if (expireTime < currentTime) {
      OTPs.splice(i, 1)
    }
  }
}

// Call checkExpiredOTPs every 3 minutes
setInterval(checkExpiredOTPs, 3 * 60 * 1000)

/********
2fa
*********/
router.post('/login/2fa', authenticateToken, async (req, res) => {
  const result = await getUserByEmail(req.user.email)
  const OTPresult = OTPs.find(otp => otp.email === req.user.email)
  //If no user exists or account is locked
  if (
    req.user.state !== 'login' ||
    !result ||
    !OTPresult ||
    result.lock === 'true'
  ) {
    return res.status(401)
  }

  if (OTPresult.expireTime < Date.now()) {
    sendOTP(OTPresult.email)
    return res.status(400).json({
      error_message: 'OTP expired, a new one was sent'
    })
  }

  if (req.body.OTP !== OTPresult.OTP) {
    return res.status(400).json({
      error_message: 'Invalid OTP'
    })
  }

  const token = generateToken(OTPresult.email, 'verified')
  res.json({
    message: 'Login sucessfuly',
    token: token
  })
})

const changePassword = async ({ email, newPassword }) => {
  try {
    await poolConnect

    // Generate random number for salt
    const salt = generateRandomNumber()

    // Hash password with salt
    const password = hash(salt + newPassword)

    const request = new sql.Request(pool)

    request.input('Salt', sql.NChar(4), salt) // Update Salt with the generated random number
    request.input('Password', sql.Char(64), newPassword) // Update Password with the hashed password
    request.input('Email', sql.VarChar(50), email) // Specify the email of the user to update
    await request.query(`UPDATE [dbo].[User]
                                        SET [Salt] = @Salt,
                                            [Password] = @Password
                                        WHERE [Email] = @Email`)

    console.log(`User with email ${email} updated successfully`)
  } catch (err) {
    console.error('Failed to connect to MSSQL server', err)
  }
}

/********
Change Password
*********/
router.post(
  '/changePw',
  authenticateToken,
  authenticateUser,
  async (req, res) => {
    const { oldPassword, newPassword } = req.body
    let user = await getUserByEmail(req.user.email)

    //If wrong old password
    if (hash(user.salt + oldPassword) !== user.password) {
      return res.status(400).json({
        error_message: 'Invalid old password'
      })
    }

    //check if new password is valid
    const validateResult = passwordSchema.validate(newPassword)
    if (validateResult.error) {
      return res.status(400).json({
        error_message: validateResult.error.message
      })
    }

    //set new salt and password for user
    changePassword(user.email, newPassword)

    //Return sucessfull message
    res.json({
      message: 'Change Password sucessfully'
    })
  }
)

/*****************************
Forget Password
******************************/
router.post('/forgetPw', async (req, res) => {
  const { email } = req.body
  let user = await getUserByEmail(email)
  if (user) {
    sendPwResetEmail(user.email)
  }
  res.sendStatus(200)
})

const sendPwResetEmail = async email => {
  try {
    const token = generateToken(email, 'resetPw')
    let response = await novu.trigger('reset-password-email', {
      to: {
        subscriberId: email,
        email: email
      },
      payload: {
        link: `http://localhost:3000/resetpw?token=${token}`
      }
    })
    console.log(
      `To ${email}: Click this link to reset your password\nhttp://localhost:3000/resetpw?token=${token}`
    )
    //console.log(response)
  } catch (err) {
    console.error(err)
  }
}

/******************************
Reset Password
*******************************/
router.post('/resetPw', authenticateToken, async (req, res) => {
  let user = await getUserByEmail(req.user.email)
  if (req.user.state !== 'resetPw' || !user) {
    return res.status(401)
  }
  const { password } = req.body

  //check if new password is valid
  const validateResult = passwordSchema.validate(password)
  if (validateResult.error) {
    return res.status(400).json({
      error_message: validateResult.error.message
    })
  }

  //set new salt and password for user
  changePassword(user.email, password)

  //Return sucessfull message
  res.json({
    message: 'Reset Password sucessfully'
  })
})

/******************************
Get coin
*******************************/
router.get(
  '/getCoin',
  authenticateToken,
  authenticateUser,
  async (req, res) => {
    ran = Math.random()
    flag = false
    try {
      if (ran <= chanceToGetCoin[req.user.level]) {
        try {
          await poolConnect

          const request = new sql.Request(pool)
          request.input('Email', sql.VarChar(50), req.user.email)
          const result = await request.query(`UPDATE [dbo].[User]
                                            SET [Coin] = [Coin] + 1
                                            WHERE [Email] = @Email`)
          // Specify the email of the user to update

          console.log(
            `User with email ${req.user.email} coin incremented successfully`
          )
        } catch (err) {
          console.error('Failed to connect to MSSQL server', err)
        }
        res.json({
          message: 'Congratulation, you got a coin!!!',
          coin: req.user.coin + 1
        })
      } else {
        res.json({
          message: 'Sorry, you got nothing.',
          coin: req.user.coin
        })
      }
    } catch (error) {
      return res.sendStatus(400)
    }
  }
)

/******************************
level Up
*******************************/
router.get(
  '/levelUp',
  authenticateToken,
  authenticateUser,
  async (req, res) => {
    if (req.user.level >= 5)
      return res.json({
        message: 'You have reached the max level',
        level: req.user.level
      })
    if (req.user.coin < coinsToLevelUp[req.user.level])
      return res.json({
        message: 'Sorry, you do not have enough coins to level up',
        level: req.user.level
      })

    try {
      await poolConnect

      const request = new sql.Request(pool)

      // Update user's coin and level

      request.input('CoinsToLevelUp', sql.Int, coinsToLevelUp[req.user.level]) // Specify the coins to level up
      request.input('Email', sql.VarChar(50), req.user.email) // Specify the email of the user to update
      const result = await request.query(`UPDATE [dbo].[User]
                                          SET [Coin] = [Coin] - @CoinsToLevelUp,
                                              [Level] = [Level] + 1
                                          WHERE [Email] = @Email`)

      console.log(
        `User with email ${req.user.email} coin and level updated successfully`
      )
    } catch (err) {
      console.error('Failed to connect to MSSQL server', err)
    }
    req.user.level++
    res.json({
      message: `Congratulation, you reached level ${req.user.level}!!!`,
      level: req.user.level
    })
  }
)

/******************************
Change nickname
*******************************/
router.post(
  '/changeNickname',
  authenticateToken,
  authenticateUser,
  async (req, res) => {
    const { nickname } = req.body
    try {
      await poolConnect

      const request = new sql.Request(pool)

      // Update user's nickname

      request.input('Nickname', sql.VarChar(50), nickname) // Specify the new nickname
      request.input('Email', sql.VarChar(50), req.user.email) // Specify the email of the user to update
      await request.query(`UPDATE [dbo].[User]
                                          SET [Nickname] = @Nickname
                                          WHERE [Email] = @Email`)
      console.log(
        `User with email ${req.user.email} nickname updated successfully`
      )
    } catch (err) {
      console.error('Failed to connect to MSSQL server', err)
    }
    res.json({
      message: `Your nickname have been changed to "${nickname}"`
    })
  }
)

/******************************
Get leaderboard
*******************************/
router.get(
  '/leaderboard',
  authenticateToken,
  authenticateUser,
  async (req, res) => {
    await poolConnect
    const request = new sql.Request(pool)
    const result = await request.query(
      `SELECT TOP 10 *
        FROM [dbo].[User]
        ORDER BY [Level] DESC, [Coin] DESC`
    )
    let top10 = result.recordset.slice(0, 10)
    const leaderboard = top10.map(user => ({
      rank: top10.findIndex(u => u === user) + 1,
      nickname: user.nickname,
      level: user.level,
      coin: user.coin
    }))

    const rank = result.recordset.findIndex(u => u.email === req.user.email) + 1
    res.json({
      leaderboard: leaderboard,
      rank: rank
    })
  }
)

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api', router)

/******************************
Web socket for chatroom
*******************************/
// Middleware function to authenticate the JWT token
const authenticateTokenForSocket = (socket, next) => {
  const authHeader = socket.handshake.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    return next(new Error('Authentication error: Missing or invalid token'))
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'))
    }
    socket.user = user
    next()
  })
}

// Middleware function to authenticate the user
const authenticateUserForSocket = async (socket, next) => {
  const user = await getUserByEmail(socket.user.email)

  if (socket.user.state !== 'verified' || !user) {
    return next(
      new Error('Authentication error: User not verified or not found')
    )
  }

  socket.user = user
  next()
}

io.use(authenticateTokenForSocket)
io.use(authenticateUserForSocket)

io.on('connection', socket => {
  console.log(`${socket.user.email} connected`)

  socket.on('message', data => {
    console.log(`${socket.user.nickname}(${socket.user.email}): ${data}`)
    io.emit('messageResponse', `${socket.user.nickname}: ${data}`)
  })

  socket.on('disconnect', () => {
    console.log(`${socket.user.email} disconnected`)
  })
})

server.listen(PORT, () => {
  console.log(`Server listening on https://localhost:${PORT}/`)
})
