const https = require('https')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const app = express()
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const User = require('./user.js')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
const crypto = require('crypto')

const PORT = 4000
const MAX_INVALID_ATTEMPT = 3
const CSV_PATH = 'users.csv'

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

const userList = []
fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', data => {
    const user = new User(data.email, data.salt, data.password, data.activate, data.lock)
    userList.push(user)
  })
  .on('end', () => {
    console.log(userList)

    function generateRandomNumber () {
      const randomNumber = Math.floor(Math.random() * 10000) // generates a random number between 0 and 999999
      return randomNumber.toString().padStart(4, '0') // ensures the string is always 6 digits long
    }

    function hash (str) {
      const hash = crypto.createHash('sha256')
      hash.update(str)
      return hash.digest('hex')
    }

    function generateToken () {
      return crypto.randomBytes(Math.ceil(16)).toString('hex').slice(0, 32)
    }

    function updateRowByEmail (email, columnToUpdate, newValue) {
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

    const options = {
      key: fs.readFileSync('key'),
      cert: fs.readFileSync('cert')
    }

    app.use(express.urlencoded({ extended: true }))
    app.use(express.json())
    app.use(cors())

    app.get('/', (req, res) => {
      res.json({ message: 'Hello world' })
    })

    app.post('/api/register', (req, res) => {
      //console.log(req.body)
      //Get the user's credentials
      const { email, password } = req.body

      //Checks if there is an existing user with the same email or password
      let result = userList.filter(user => user.email === email)

      //if none
      if (result.length === 0) {
        //creates the structure for the user
        salt = generateRandomNumber()
        const newUser = new User(email, salt, hash(salt + password), false, false)
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
        //Returns a message
        return res.json({
          message: 'Account created successfully'
        })
      }
      //Runs if a user exists
      res.json({
        error_message: 'This email is already registered'
      })
    })

    app.post('/api/login', (req, res) => {
      //Accepts the user's credentials
      const { email, password } = req.body
      //Checks for user(s) with the same email and password
      let result = userList.filter(user => user.email === email)

      //If no user exists
      if (result.length !== 1) {
        return res.json({
          error_message: 'This email is not registered'
        })
      }

      //If account is locked
      if (result[0].lock === 'true') {
        return res.json({
          error_message:
            'This account is temporarily locked\nTo unlock, please check you email'
        })
      }

      //If wrong password
      if (hash(result[0].salt + password) !== result[0].password) {
        result[0].invalidAttempt++
        if (result[0].invalidAttempt > MAX_INVALID_ATTEMPT) {
          result[0].lock = true
          updateRowByEmail(result[0].email, 'lock', 'true');
          return res.json({
            error_message:
              'Multiple invalid logins, the account is temporarily locked\nTo unlock, please check you email'
          })
        }
        return res.json({
          error_message: 'Invalid password, Attempt:' + result[0].invalidAttempt
        })
      }

      //Returns a token after a successful login
      token = generateToken()
      result[0].token = token
      res.json({
        message: 'Login successfully',
        token: token
      })
    })

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

    https.createServer(options, app).listen(PORT, () => {
      console.log(`Server listening on ${PORT}: https://localhost:4000/`)
    })
  })
