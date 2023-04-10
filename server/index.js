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

const csvWriter = createCsvWriter({
  path: CSV_PATH,
  header: [
    { id: 'email', title: 'email' },
    { id: 'salt', title: 'salt' },
    { id: 'password', title: 'password' },
    { id: 'activate', title: 'activate' },
    { id: 'lock', title: 'lock' }
  ]
})

let userList = []
let OTPs = []
fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', data => {
    const user = new User(
      data.email,
      data.salt,
      data.password,
      data.activate,
      data.lock
    )
    userList.push(user)
  })
  .on('end', () => {
    console.log('Finish reading users.csv')
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

const updateRowByEmail = (email, columnToUpdate, newValue) => {
  const results = []
  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', data => results.push(data))
    .on('end', () => {
      const updatedResults = results.map(result => {
        if (result.email === email) {
          result[columnToUpdate] = newValue
        }
        return result
      })
      csvWriter
        .writeRecords(updatedResults)
        .then(() => console.log('CSV file updated successfully'))
    })
}

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).+$'))
    .required()
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
    if (err) return res.sendStatus(403).json(err)
    req.user = user
    next()
  })
}

const authenticateUser = (req, res, next) => {
  if (
    req.user.state !== 'verified' ||
    !userList.find(user => user.email === req.user.email)
  )
    return res.status(400)
  next()
}

/********
Root
*********/
router.get('/api', authenticateToken, authenticateUser, (req, res) => {
  res.json({ email: req.user.email })
})

const generateResgisterToken = (email, password) => {
  return jwt.sign({ email: email, password: password }, SECRET_KEY, {
    expiresIn: '1h'
  })
}

/********
Resgister
*********/
router.post('/api/register', (req, res) => {
  //Get the user's credentials
  const { email, password } = req.body

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
  const newUser = new User(email, salt, hash(salt + password), false, false)
  //Adds the user to the list of users
  //userList.push(newUser)
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
  //Send OTP
  sendOTP(email)
  //Returns a register token
  const token = generateResgisterToken(email, password)
  res.json({
    message: 'Please enter the OTP that sent to your email',
    token: token
  })
  return res.json({
    message: 'Account created successfully'
  })
})

/********
Login
*********/
router.post('/api/login', (req, res) => {
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
      updateRowByEmail(result.email, 'lock', 'true')
      return res.status(400).json({
        error_message:
          'Multiple invalid logins, the account is temporarily locked\nTo unlock, please check you email'
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
2fa
*********/
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

router.post('/api/login/2fa', authenticateToken, (req, res) => {
  const result = userList.find(user => user.email === req.user.email)
  const OTPresult = OTPs.find(otp => otp.email === req.user.email)
  //If no user exists or account is locked
  if (
    req.user.state !== 'login' ||
    !result ||
    !OTPresult ||
    result.lock === 'true'
  ) {
    return res.status(400)
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

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/', router)

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server listening on https://localhost:${PORT}/`)
})
