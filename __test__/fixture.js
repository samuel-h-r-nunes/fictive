// Procedural data fixture

const now = new Date()

const users = [
  { name: 'admin', pw: 'admin' },
  { name: 'john_doe', pw: '12345' }
]

const fixture = users.map((user, i) => ({
  id: 1 + i,
  username: user.name,
  password: user.pw,
  lastLogin: now.toISOString()
}))

module.exports = fixture
module.exports.now = now
