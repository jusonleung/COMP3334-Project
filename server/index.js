require('dotenv').config()
const https = require('https')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const router = express.Router()
const app = express()
const Joi = require('joi')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const User = require('./user.js')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
const crypto = require('crypto')
const { Novu } = require('@novu/node')
const jwt = require('jsonwebtoken')

const PORT = 4000
const MAX_INVALID_ATTEMPT = 3
const CSV_PATH = 'users.csv'
const SECRET_KEY =
  'c6599d14324d6a3c011209e5317bfec8eb4506be0bf03a5b8c07d1e7fab9a6a974686bc0662fdcf5c900d79035fbcc124559d0d89a45d80b11e2ca2e10a41373'

const novu = new Novu(process.env.NOVU_API_KEY)
const chanceToGetCoin = [0.1, 0.15, 0.25, 0.4, 0.65, 1]
const coinsToLevelUp = [5, 10, 30, 80]

let userList = []
let OTPs = []
fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', data => {
    const user = new User(
      data.email,
      data.nickname,
      data.salt,
      data.password,
      data.activate,
      data.lock,
      parseInt(data.coin),
      parseInt(data.level)
    )
    userList.push(user)
  })
  .on('end', () => {
    console.log('Finish reading users.csv')
    console.log(userList)
  })

const generateRandomNumber = () => {
  const randomNumber = Math.floor(Math.random() * 10000) // generates a random number between 0 and 999999
  return randomNumber.toString().padStart(4, '0') // ensures the string is always 6 digits long
}

const hash = str => {
  const hash = crypto.createHash('sha256')
  hash.update(str)
  return hash.digest('hex')
}

const updateCSV = () => {
  const csvHeader = 'email,nickname,salt,password,activate,lock,coin,level\n'
  // CSV data rows
  const csvRows = userList
    .map(
      row =>
        `${row.email},${row.nickname},${row.salt},${row.password},${row.activate},${row.lock},${row.coin},${row.level}`
    )
    .join('\n')
  // Combine header and rows
  const csvData = csvHeader + csvRows
  fs.writeFile(CSV_PATH, csvData, err => {
    if (err) throw err
    console.log('CSV file has been updated.')
  })
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

const options = {
  key: fs.readFileSync('key'),
  cert: fs.readFileSync('cert')
}

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

const authenticateUser = (req, res, next) => {
  user = userList.find(u => u.email === req.user.email)
  if (req.user.state !== 'verified' || !user) return res.status(401)
  req.user = user
  next()
}

router.get('/', authenticateToken, authenticateUser, (req, res) => {
  res.json({ message: 'Hello world' })
})

/********
getInfo
*********/
router.get('/getInfo', authenticateToken, authenticateUser, (req, res) => {
  res.json({
    nickname: req.user.nickname,
    coin: req.user.coin,
    level: req.user.level
  })
})

/********
Resgister
*********/
router.post('/register', (req, res) => {
  //Get the user's credentials
  const { email, password, nickname } = req.body

  const validateResult = registerSchema.validate({ email, password })
  if (validateResult.error) {
    return res.status(400).json({
      error_message: validateResult.error.message
    })
  }

  //Checks if there is an existing user with the same email or password
  const result = userList.find(user => user.email === email)

  //Runs if a user exists
  if (result) {
    return res.status(400).json({
      error_message: 'This email is already registered'
    })
  }
  //creates the structure for the user
  salt = generateRandomNumber()
  const newUser = new User(
    email,
    nickname,
    salt,
    hash(salt + password),
    false,
    false
  )
  //Adds the user to the list of users
  userList.push(newUser)
  //Append user detail to users.csv
  const row = [
    newUser.email,
    newUser.salt,
    newUser.password,
    newUser.activate,
    newUser.lock
  ]
  fs.appendFile(CSV_PATH, row.join(',') + '\n', err => {
    if (err) throw err
    console.log('User', row[0], 'appended to file')
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
    const token = generateToken(email, 'activate')
    /* let response = await novu.trigger('activation-email', {
      to: {
        subscriberId: email,
        email: email
      },
      payload: {
        link: `http://localhost:3000/activate?token=${token}`
      }
    }) */
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
router.post('/login', (req, res) => {
  //Accepts the user's credentials
  const { email, password } = req.body
  //Checks for user(s) with the same email and password
  const result = userList.find(user => user.email === email)

  //If no user exists
  if (!result) {
    return res.status(400).json({
      error_message: 'This email is not registered'
    })
  }

  //If account is locked
  if (result.lock === 'true') {
    sendActivationEmail(result.email, true)
    return res.status(400).json({
      error_message:
        'This account is temporarily locked\nTo unlock, please check you email'
    })
  }

  //If wrong password
  if (hash(result.salt + password) !== result.password) {
    result.invalidAttempt++
    if (result.invalidAttempt > MAX_INVALID_ATTEMPT) {
      result.lock = true
      updateCSV()
      sendActivationEmail(result.email, true)
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
router.get('/activate', authenticateToken, (req, res) => {
  let user = userList.find(user => user.email === req.user.email)
  if (req.user.state !== 'activate' || !user) return res.status(401)
  let locked = user.lock
  if (locked) user.lock = false
  user.activate = true
  user.invalidAttempt = 0
  //updateRowByEmail('jusonleung3@gmail.com','activate',true)
  updateCSV()
  updateCSV()
  const token = generateToken(user.email, 'verified')
  res.json({
    message: `Your account ${user.email} is ${
      locked ? 'unlocked' : 'activated'
    }`,
    token: token
  })
})

const sendOTP = async email => {
  try {
    OTPs = OTPs.filter(otp => otp.email !== email)
    const OTP = generateRandomNumber()
    /* let response = await novu.trigger('OTP', {
      to: {
        subscriberId: email,
        email: email
      },
      payload: {
        OTP: OTP
      }
    }) */
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
router.post('/login/2fa', authenticateToken, (req, res) => {
  const result = userList.find(user => user.email === req.user.email)
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

/********
Change Password
*********/
router.post('/changePw', authenticateToken, authenticateUser, (req, res) => {
  const { oldPassword, newPassword } = req.body
  let user = userList.find(user => user.email === req.user.email)

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
  user.salt = generateRandomNumber()
  user.password = hash(user.salt + newPassword)
  updateCSV()

  //Return sucessfull message
  res.json({
    message: 'Change Password sucessfully'
  })
})

/*****************************
Forget Password
******************************/
router.post('/forgetPw', (req, res) => {
  const { email } = req.body
  let user = userList.find(user => user.email === email)
  if (user) {
    sendPwResetEmail(user.email)
  }
  res.sendStatus(200)
})

const sendPwResetEmail = async email => {
  try {
    const token = generateToken(email, 'resetPw')
    /* let response = await novu.trigger('reset-password-email', {
      to: {
        subscriberId: email,
        email: email
      },
      payload: {
        link: `http://localhost:3000/resetpw?token=${token}`
      }
    }) */
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
router.post('/resetPw', authenticateToken, (req, res) => {
  let user = userList.find(user => user.email === req.user.email)
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
  user.salt = generateRandomNumber()
  user.password = hash(user.salt + password)
  updateCSV()

  //Return sucessfull message
  res.json({
    message: 'Reset Password sucessfully'
  })
})

/******************************
Get coin
*******************************/
router.get('/getCoin', authenticateToken, authenticateUser, (req, res) => {
  ran = Math.random()
  flag = false
  try {
    if (ran <= chanceToGetCoin[req.user.level]) {
      req.user.coin++
      updateCSV()
      res.json({
        message: 'Congratulation, you got a coin!!!',
        coin: req.user.coin
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
})

/******************************
level Up
*******************************/
router.get('/levelUp', authenticateToken, authenticateUser, (req, res) => {
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
  req.user.coin -= coinsToLevelUp[req.user.level]
  req.user.level++
  updateCSV()
  res.json({
    message: `Congratulation, you reached level ${req.user.level}!!!`,
    level: req.user.level
  })
})

/******************************
Change nickname
*******************************/
router.post(
  '/changeNickname',
  authenticateToken,
  authenticateUser,
  (req, res) => {
    const { nickname } = req.body
    req.user.nickname = nickname
    updateCSV()
    res.json({
      message: `Your nickname have been changed to "${req.user.nickname}"`
    })
  }
)

/******************************
Get leaderboard
*******************************/
router.get('/getLeaderboard', authenticateToken, authenticateUser, (req, res) => {
    const sortedList = userList.slice().sort((a, b) => {
      if (a.level === b.level) {
        return b.coin - a.coin
      } else {
        return b.level - a.level
      }
    })
    const leaderboard = sortedList.slice(0, 10).map(user => ({
      rank: sortedList.findIndex(u => u === user) + 1,
      nickname: user.nickname,
      level: user.level,
      coin: user.coin
    }));

    const rank = sortedList.findIndex(user => user.email === req.user.email) + 1
    res.json({
      leaderboard: leaderboard,
      rank: rank
    })
  }
)

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api', router)

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server listening on https://localhost:${PORT}/`)
})
