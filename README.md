# fictive

`fictive` provides simple tools to implement client-side mocks of services. Fake API calls without the need for an internet connection, so that you can develop and demonstrate your prototype anyhwere.

## Install

```bash
npm install fictive --save-dev
```

## Motivation

`fictive` was inspired by [this article](https://goshakkk.name/why-i-mock-api-in-mobile-apps/). During development, especially when developing a mobile app, it's very useful to abstract external services away. The best way to do so is simply to mock your APIs and services.

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

When `USE_MOCK_API` is enabled, the fake implementation will be loaded and executed instead of the real one. It goes without saying that both implementations should behave in the same way.

Regardless of whether you're mocking your service calls, using these wrapper functions is a very useful pattern. It allows you to develop your frontend using external services without worrying how they're actually implemented. And if your API changes in the future, you just need to adjust the wrapper functions without touching the code that makes use of them.

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

You might have noticed that, compared to the first example, two new things are new here - the files `db.js` and `example.json`. These are meant for database mocking, which we will see later on.

### Mocking different services

#### A successful response

TODO ...

#### Failure

TODO ...

#### A mocked database

TODO ...
