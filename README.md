# fictive<!-- omit in toc -->

[![Version](https://img.shields.io/npm/v/fictive.svg)](https://www.npmjs.com/package/fictive) [![MIT License](https://img.shields.io/npm/l/fictive.svg)](https://opensource.org/licenses/MIT) [![Downloads](https://img.shields.io/npm/dt/fictive.svg)](https://www.npmjs.com/package/fictive)

`fictive` provides simple tools to implement client-side mocks of services. Use it to fake API calls without an internet connection, so that you can develop and demonstrate your prototype anyhwere.

#### Table of contents<!-- omit in toc -->

- [1. Installation](#1-installation)
- [2. Motivation](#2-motivation)
- [3. A quick example](#3-a-quick-example)
- [4. Usage](#4-usage)
  - [4.1. Prerequisites](#41-prerequisites)
    - [4.1.1. Wrapper functions](#411-wrapper-functions)
    - [4.1.2. Proposed file structure](#412-proposed-file-structure)
  - [4.2. Mocking different services](#42-mocking-different-services)
    - [A successful response](#a-successful-response)
    - [Failure](#failure)
  - [4.3. Mocking persistent data (a fake database)](#43-mocking-persistent-data-a-fake-database)
    - [Creating the fake database](#creating-the-fake-database)
    - [Using the fake database](#using-the-fake-database)
    - [Inserting rows](#inserting-rows)
    - [Deleting rows](#deleting-rows)
    - [Updating existing rows](#updating-existing-rows)
    - [Searching](#searching)
  - [4.4. Complex examples](#44-complex-examples)
  - [4.5. Integrating with an existing project](#45-integrating-with-an-existing-project)
    - [4.5.1. Introducing the `withFictive` pattern](#451-introducing-the-withfictive-pattern)
    - [4.5.2. Limitations](#452-limitations)
    - [4.5.3. The future](#453-the-future)

## 1. Installation

```bash
npm install fictive --save-dev
```

## 2. Motivation

`fictive` was inspired by [this article](https://goshakkk.name/why-i-mock-api-in-mobile-apps/). During development, especially when developing a mobile app, it's very useful to abstract external services away. The best way to do that is to mock your APIs and services.

However, most available solutions rely on an internet connection or on a local server that you run from the command line. For mobile app development this is not ideal. You will often find yourself in need of showing your prototype running directly from a phone, away from your development machine. You need your mocked services to run on the client side.

## 3. A quick example

Let's say you're making a list of users in react. You know that you'll be fetching those users from an external API, which is already specified but not developed/available yet.

So instead of calling the API directly, you simply wrap the service call in a getter/selector function. For this example we will call it `getUsers`, and call it on the `componentWillMount` of a very simple controlled component:

```js
// src/views/UserList.js

import react, { Component } from 'react'
import getUsers from '../services/users'

export default class UserList extends Component {
  state = { users: [] };

  componentWillMount() {
    getUsers().then(users => this.setState({ ...this.state, users }))
  }

  render() {
    return (
      <ul>
        {this.state.users.map((user) => (
          <li key={user.id}>
            {user.name} {user.surname} ({user.email})
          </li>
        ))}
      </ul>
    )
  }
```

So when our component is initially mounted, `getUsers` is called asynchronously. Then, as soon as its promise resolves, the local state will be updated with the new list of users, which will trigger a re-render of the list.

This is a very simple example, but the important rule to retain here is: _use a wrapper function instead of calling the external service directly._

By following this simple rule, you abstract the service call away. Then, as long as the result looks like the expected format, it doesn't matter where it comes from - and you can develop as usual.

But what does this `getUsers` wrapper look like?

Well, it's rather simple:

```js
// src/services/users.js

export const getUsers = () => {
  if (process.env.USE_MOCK_API) {
    return require('./__mock__/users').getUsers()
  }

  return fetch('http://example.com/users').then(res => res.json())
}
```

First of all, our wrapper to be prepared to do whatever its original purpose was (calling the external API). But before that, there's just one extra thing - it needs to check whether to use the mocked service instead of the real one.

_(Tip: Put all your service call wrappers in a centralized place, where you can easily make changes when the specs change.)_

Now you can implement the mocked services using `fictive`'s shortcut methods `fakeReply`, `fakeError`, etc. If you need to simulate persistance, or simply for the conveninece of `fictive`'s pseudo-database methods, you can also use `fakeDB`:

```js
// src/services/__mock__/users.js

import { fakeReply } from 'fictive'
import db from './db'

export const getUsers = () => {
  return fakeReply(db.search('users'))
}
```

```js
// src/services/__mock__/db.js

import { FakeDB } from 'fictive'

const fakeDB = new FakeDB()
fakeDB.create('users', [
  {
    "id": 1,
    "name": "John",
    "surname": "Fictive",
    "email": "john.fictive@example.com"
  },
  {
    "id": 2,
    "name": "Mary",
    "surname": "Mock",
    "email": "mary.mock@example.com"
  }
])

export default fakeDB
```

## 4. Usage

### 4.1. Prerequisites

#### 4.1.1. Wrapper functions

First off, you should wrap your service/API calls in functions that will look (and act) the same regardless of whether the real API or the mocked one are called.

```js
// src/services/example.js

export const myExample = (params) => {
  if (process.env.USE_MOCK_API) {
    return require('./__mock__/example').myExample(params)
  }

  // NOTE: The real API call goes here, e.g.: return fetch(...)
}
```

When `USE_MOCK_API` is enabled, the fake implementation will be loaded and executed instead of the real one. It goes without saying that both implementations should behave the same way.

Regardless of whether you're mocking your service calls, using these wrapper functions is a very useful pattern. It allows you to develop your frontend using external services without worrying how they're actually implemented. And if your API changes in the future, you only need to adjust the wrapper functions without touching the code that makes use of them!

#### 4.1.2. Proposed file structure

To keep things organised, the following directory structure is suggested:

```bash
  .
  ├── src
  │   ├── services
  │   │   ├── __mock__
  │   │   │   ├── db.js
  │   │   │   ├── example.js
  │   │   │   └── example.json
  │   │   └── example.js
  ... ...
```

All services are grouped together in a directory of their own. This way, all communication with the outside world (and the corresponding mocks) is centralized in one place.

**Note:** the files `db.js` and `example.json` inside the `__mock__` directory are meant for database mocking, which we will see later on.

### 4.2. Mocking different services

#### A successful response

Successful responses are created using `fakeReply`:

```js
// src/services/__mock__/example.js

import { fakeReply } from 'fictive'

export const myExample = (params) => {
  return fakeReply({ someKey: 'Some example content!' })
}
```

This will wrap the specified content in a delayed promise and return the result. The promise will resolve to the specified value after a default delay of 200 ms, to simulate network overhead.

For specific scenarios, you can also specify the delay, via the second (optional) parameter:

```js
// src/services/__mock__/example.js

import { fakeReply } from 'fictive'

export const mySlowExample = (params) => {
  return fakeReply(
    'You could also provide a string here, if you need',
    2000 // Will take 2 whole seconds to resolve!
  )
}
```

#### Failure

Failure responses are created the same way - the only difference is that `fakeError` is used this time around:

```js
// src/services/__mock__/example.js

import { fakeError } from 'fictive'

export const myExampleFailure = (params) => {
  return fakeError({ anotherKey: 'An example error message...' })
}
```

Again, we simulate network overhead using a default delay of 200 ms, after which the promise will reject with the specified value. The delay can be specified via the second (optional) parameter to `fakeError`, just like in `fakeReply`.

### 4.3. Mocking persistent data (a fake database)

Mocking a database may seem overkill, but it can be useful to get a feel of the user experience in complex workflows before the actual API is available.

To be clear, what we need to mock is only the persistence and transformation of data over time. Fortunately, for our purpose of simulating an API during development and testing, (1) this persistence can be just temporary and (2) the datasets are typically very small.

With that in mind, `fictive` takes a minimalist approach to database mocking. Instead of an actual database, the `FakeDB` class provides a very thin layer which is nothing more than a wrapper to store and manipulate javascript arrays using regular javascript array methods. These arrays will persist for as long as your javascript code is running.

Please think of `FakeDB` as just tool for simple data manipulations - to help mock service calls that handle persistent data.

#### Creating the fake database

The fake database should be created in a centralized place, so that all mocked services can use the same `FakeDB` instance. Our suggestion is to do this in `__mock__/db.js` as mentioned before:

```js
// src/services/__mock__/db.js

import { FakeDB } from 'fictive'

const fakeDB = new FakeDB()
fakeDB.create('users', require('./example.json'))

export default fakeDB
```

In this simple example, we instantiate `FakeDB` and then use `create()` to create an entity named `users` with initial data retrieved from a separate JSON file:

```json
[
  {
    "id": 1,
    "username": "admin",
    "password": "admin"
  },
  {
    "id": 2,
    "username": "john_doe",
    "password": "12345"
  }
]
```

Further entities can be created via separate calls to `create()`.

**Note:** At the end of `db.js` we simply export our database object. Due to the way how the Node.js module system [works](https://nodejs.org/api/modules.html#modules_require_cache), every time we require this module we will get the exact same object. This means that `db.js` essentially works as a singleton for our fake database.

#### Using the fake database

To make use of your fake database, you just have to import it in your service mocks:

```js
// src/services/__mock__/example.js

import db from './db'

export const example = ( /* ... */ ) => {

  // Do something with `db` ...

}
```

#### Inserting rows

You can insert a row using `insert()`, and specifying the entity name and a data object containing the row data:

```js
db.insert('users', {
  id: 3,
  username: 'jane_doe',
  password: 'abcde'
})
```

Note that there's no validation of schema whatsoever. Each row will get the exact data provided in the second argument, regardless of whether it makes sense. This means that you are responsible for inserting correct data when designing the use cases to mock.

Nevertherless, you can avoid the manual work of calculating auto-incremented primary keys, by specifying the optional third argument `primaryKey` and omitting the corresponding field from the data array:

```js
const insertedKey = db.insert(
  'users',
  { username: 'jane_doe', password: 'abcde' },
  'id'
)
```

#### Deleting rows

To delete one or more rows, use `delete()` and specify the entity name and a match function to locate the rows to delete:

```js
// Remove the user with `id` equal to 3
const totalDeletions = db.delete('users', (user) => user.id === 3)
```

#### Updating existing rows

You can also update existing rows, using `update()` and specifying the entity name together with the updated data and a match function:

```js
// Change the username and password for the user with `id` equal to 2
const totalDeletions = db.update(
  'users',
  { username: 'new_username', password: 'new_password' },
  (user) => user.id === 2
)
```

The specified data will be appended to the matched rows, overwriting any overlapping keys.

#### Searching

Searching for a given row, or set of rows is done via `search()`, and specifying the entity name and a filter function:

```js
// Find users with username starting with "j"
const results = db.search('users', (user) => user.name.match(/^j/))
```

Likewise, you can use `testSome()` to check whether there are at least some rows matching your filter:

```js
if (db.testSome('users', (user) => user.name === 'john_doe') {
  console.log('A user named "john_doe" already exists.')
}
```

### 4.4. Complex examples

Checking if the desired user name already exists, when registering a new user:

```js
// src/services/__mock__/registerUser.js

import { fakeError, fakeReply } from 'fictive'
import db from './db'

export const registerUser = (username, password) => {
  // Make sure that there's no user with the same username
  if (db.testSome('users', (user) => user.username === username)) {
    return fakeError({ error: 'User already exists!' })
  }

  // Insert user and reply with the newly created ID
  return fakeReply({
    id: db.insert('users', { username, password }, 'id')
  })
}
```

### 4.5. Integrating with an existing project

So far the examples have been pretty simple. On each example we created a wrapper function which internally decides whether to use the mock API or the real one. However, to cover a big API with many endpoints this pattern can quickly become tedious.

This problem is especially true when integrating with an existing project, where such wrappers functions are likely to be created already. For example:

```js
// src/services/users.js

const users = {
  getAll: () => fetch('http://example.com/users').then(res => res.json()),
  search: (text) => { /* TODO fetch ... */ },
  create: (data) => { /* TODO fetch ... */ },
  delete: (id) => { /* TODO fetch ... */ },
  update: (id, data) => { /* TODO fetch ... */ }
})

export default users
```

To minimize this problem, a possible approach could be to invert the pattern and move the check outside of the wrapper function.

#### 4.5.1. Introducing the `withFictive` pattern

Without furthe ado, here's the previous example with a few modifications:

```js
// src/services/users.js
import { withFictive } from './__mock__/withFictive'

const users = {
  getAll: () => fetch('http://example.com/users').then(res => res.json()),
  search: (text) => { /* TODO fetch ... */ },
  create: (data) => { /* TODO fetch ... */ },
  delete: (id) => { /* TODO fetch ... */ },
  update: (id, data) => { /* TODO fetch ... */ }
})

export default withFictive(users, 'users')
```

So with just a few changes to the existing code, we open the door for implementing our mocks in one single go. Those will come in a separate file as usual:

```js
// src/services/__mock__/users.js

import { fakeReply } from 'fictive'
import db from './db'

export const usersMock = {
  getAll: () => fakeReply(db.search('users')),
  search: (text) => { /* ... See previous examples ... */ },
  create: (data) => { /* ... See previous examples ... */ },
  delete: (id) => { /* ... See previous examples ... */ },
  update: (id, data) => { /* ... See previous examples ... */ }
}
```

Finally, the `withFictive` High-Order Function centralizes the decision-making:

```js
// src/services/__mock__/withFictive.js

export default (service, mock) => {
  if (process.env.USE_MOCK_API) {
    return {
      ...service,
      ...require('./' + mock)
    }
  }
}
```

The check for whether to use the mock API is centralized in this function, which will return either the original services or the mocked ones. As a bonus, this also means that the check now occurs only once when the services are first imported, instead of on every service call.

#### 4.5.2. Limitations

Before you proceed, please be warned. This is is still an experimental concept, and still not part of `fictive` itself - you will have to copy it and add it somewhere in your project yourself.

Most importantly, please be aware of the following limitations:

- This concept is focused on a very specific use case where the service wrappers are grouped per namespace. We believe that this is good idea to keep things organised, but it might not fit your particular use case.
- In its current state, the `withFictive` function described above will blindly return the full mock namespace object without any validation. It won't check if an unexisting method is being mocked, or fallback to the original method if a mock is missing.

#### 4.5.3. The future

Despite the current limitations, `withFictive` looks very promising as a feature to include out of the box in the future. By providing a centralized way of controlling `fictive`, it could even become the gateway for exciting new features like a proxy mode which grabs data from the real API to create new mocks.
