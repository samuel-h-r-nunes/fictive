/* eslint-env jest */

const fakeReply = require('../index').fakeReply
const fakeError = require('../index').fakeError
const FakeDB = require('../index').FakeDB

const fixture = [
  { id: 1, content: 'aaa' },
  { id: 2, content: 'bbb' },
  { id: 3, content: 'ccc' }
]

it('mocks a successful response', () => {
  return expect(fakeReply('success')).resolves.toEqual('success')
})

it('mocks an error response', () => {
  return expect(fakeError('error')).rejects.toEqual('error')
})

it('mocks a database table select', () => {
  const fakeDB = new FakeDB()
  fakeDB.create('table', fixture)
  return expect(fakeDB.search('table', (entry) => entry.id === 2)).toEqual([{ id: 2, content: 'bbb' }])
})

it('mocks a database table insert', () => {
  const fakeDB = new FakeDB()
  fakeDB.create('table', fixture)
  return expect(fakeDB.insert('table', { content: 'new entry' }, 'id')).toEqual(4)
})

it('mocks a database table delete', () => {
  const fakeDB = new FakeDB()
  fakeDB.create('table', fixture)
  return expect(fakeDB.delete('table', (entry) => entry.id === 2)).toEqual(1)
})

it('mocks a database table create, insert and select', () => {
  const fakeDB = new FakeDB()
  fakeDB.create('table', fixture)
  fakeDB.insert('table', { content: 'new entry' }, 'id')
  return expect(fakeDB.search('table', (entry) => entry.id === 4)).toEqual([{ id: 4, content: 'new entry' }])
})
