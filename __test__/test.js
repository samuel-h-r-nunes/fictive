/* eslint-env jest */

const fakeReply = require('../index').fakeReply
const fakeError = require('../index').fakeError
const FakeDB = require('../index').FakeDB

const fixture = [
  { id: 1, content: 'aaa' },
  { id: 2, content: 'bbb' },
  { id: 3, content: 'ccc' }
]

const fakeDB = new FakeDB()
beforeEach(() => {
  fakeDB.create('table', fixture)
})

// Support function to inspect internal table content
const contentOf = function (name) {
  return this.storage[name]
}.bind(fakeDB)

test('mocks a successful response', () => {
  return expect(fakeReply('success')).resolves.toEqual('success')
})

test('mocks an error response', () => {
  return expect(fakeError('error')).rejects.toEqual('error')
})

test('mocks a database table create', () => {
  const data = [
    { id: 1, name: 'one' },
    { id: 2, name: 'two' }
  ]
  fakeDB.create('newtable', data)
  expect(contentOf('newtable')).toEqual(data)
})

test('mocks creating a database table with procedural data', () => {
  const now = require('./fixture').now
  const expected = [
    {
      id: 1,
      username: 'admin',
      password: 'admin',
      lastLogin: now.toISOString()
    },
    {
      id: 2,
      username: 'john_doe',
      password: '12345',
      lastLogin: now.toISOString()
    }
  ]
  fakeDB.create('proctable', require('./fixture'))
  expect(contentOf('proctable')).toEqual(expected)
})

test('mocks getting all rows from a database table', () => {
  expect(fakeDB.search('table')).toEqual([
    { id: 1, content: 'aaa' },
    { id: 2, content: 'bbb' },
    { id: 3, content: 'ccc' }
  ])
})

test('mocks a database table search', () => {
  expect(fakeDB.search('table', (entry) => entry.id === 2)).toEqual([{ id: 2, content: 'bbb' }])
})

test('mocks a database table insert', () => {
  expect(fakeDB.insert('table', { content: 'new entry' }, 'id')).toEqual(4)
  expect(contentOf('table')).toEqual([
    { id: 1, content: 'aaa' },
    { id: 2, content: 'bbb' },
    { id: 3, content: 'ccc' },
    { id: 4, content: 'new entry' }
  ])
})

test('mocks a database table update', () => {
  expect(fakeDB.update('table', { content: 'modified' }, (entry) => entry.id === 2)).toEqual(1)
  expect(contentOf('table')).toEqual([
    { id: 1, content: 'aaa' },
    { id: 2, content: 'modified' },
    { id: 3, content: 'ccc' }
  ])
})

test('mocks a database table delete', () => {
  expect(fakeDB.delete('table', (entry) => entry.id === 2)).toEqual(1)
  expect(contentOf('table')).toEqual([
    { id: 1, content: 'aaa' },
    { id: 3, content: 'ccc' }
  ])
})
