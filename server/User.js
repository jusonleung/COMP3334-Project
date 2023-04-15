class User {
  constructor (email, nickname, salt, password, activate, lock, coin = 0, level = 0) {
    this.email = email
    this.nickname = nickname
    this.salt = salt
    this.password = password
    this.activate = activate
    this.lock = lock
    this.invalidAttempt = 0
    this.coin = coin
    //0: 10% 1:15% 2:25% 3:40% 4:65% 5:100% 
    this.level = level
  }
}

module.exports = User
