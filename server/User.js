class User {
  constructor (email, salt, password, activate, lock) {
    this.email = email
    this.salt = salt
    this.password = password
    this.activate = activate
    this.lock = lock
    this.invalidAttempt = 0
  }
}

module.exports = User
