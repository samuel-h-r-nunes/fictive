# fictive

`fictive` provides simple tools to implement client-side mocks of services. Fake API calls without the need for an internet connection, so that you can develop and demonstrate your prototype anywhere.

## Install

```bash
npm install fictive --save-dev
```

## Motivation

`fictive` was inspired by [this article](https://goshakkk.name/why-i-mock-api-in-mobile-apps/). During development, especially when developing a mobile app, it's very useful to abstract external services away. The best way to do that is to mock your APIs and services.

However, most available solutions rely on an available internet connection or on a local server that you run from the command line. For mobile app development this is not ideal. You will find yourself needing to show your prototype running directly from your phone, away from your development machine. You need your mocked services to run on the client side.

## Usage

### Prerequisites

First off, you should wrap your service/API calls in functions that will look (and act) the same regardless of whether the real or the mock API is called.

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

To keep things organised, the following folder structure is suggested:

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

All services are grouped together in a folder of their own. This way, all communication with the outside world (and the corresponding mocks) is centralized in one place.

You might have noticed that compared to the first example two things are new here - the files `db.js` and `example.json` inside the `__mock__` folder. These are meant for database mocking, which we will see later on.

### Mocking different services

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

For specific scenarios, you can also specify the delay, via the second (optional) parameter to `fakeReply`:

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

#### A mocked database

Mocking a database may seem overkill, but it can be useful to get a feel of the user experience in complex workflows before the actual API is available.

To be clear, what we really need to mock is just the persistence and transformation of data over time that is usually achieved with a database. Fortunately, for our purpose of simulating an API during development and testing, (1) this persistence can be just temporary and (2) the datasets are typically very small.

With this in mind,  `fictive` takes a minimalist approach to database mocking, without using a real database. Instead, the `FakeDB` class provides a very thin layer which is nothing more than a wrapper to store and manipulate javascript arrays using regular javascript array methods.

##### Creating the fake database

Before you can mock services using a fake database, you have to create the database itself. This should be done in a centralized place, so that all mocked services can use the same `FakeDB` instance. The recommendation is to do this in `__mock__/db.js` as mentioned before:

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

##### Inserting and deleting rows

TODO ...

##### Searching

TODO ...

##### Complex examples

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
