/**
 * Controller object to simulate and manipulate fake data.
 */
class FakeDB {
  constructor () {
    this.storage = {}
  }

  /**
   * Create a new entity, with the specified name. If an entity with the same
   * name already exists, it will be overwritten.
   *
   * @param {String} entityName   Name of the entity to create.
   * @param {*}      initialState Optional. This can be anything, but will
   *                              default to an empty array, if not specified.
   */
  create (entityName, initialState) {
    let data = []
    if (Array.isArray(initialState)) {
      data = [...initialState]
    } else if (initialState !== undefined) {
      data = initialState
    }

    this.storage[entityName] = data
  }

  /**
   * Insert new entry on the specified (array type) entity
   *
   * @param {String} entityName Name of the entity where to do the insert. Must
   *                            be an entity of type array, as this will behave
   *                            like a database table.
   * @param {Object} entry      Data object to insert as an entry.
   * @param {String} primaryKey If specified, this field will be auto-generated
   *                            for the new entry to simulate "auto-increment",
   *                            according to the existing data. _(default: undefined)_
   *
   * @returns {Number} The primary key value of the inserted value, or `undefined`
   *                   if no `primaryKey`was specified.
   */
  insert (entityName, entry, primaryKey) {
    if (entry.constructor !== Object) {
      throw new Error('Entry to insert is not a data object.')
    }
    const entity = arrayEntity(this.storage, entityName)
    const data = { ...entry }

    // Auto-increment primary key
    if (primaryKey) {
      data[primaryKey] = 1 + entity.map(row => row[primaryKey]).reduce((max, cur) => Math.max(max, cur), 0)
    }

    entity.push(data)

    return data[primaryKey] || undefined
  }

  /**
   * Update entries on the specified (array type) entity
   *
   * @param {String}   entityName Name of the entity where to do the update. Must
   *                              be an entity of type array, as this will behave
   *                              like a database table.
   * @param {Object}   data       Data object, with new values to be set on the
   *                              matched entries.
   * @param {Function} matchFunc  Annonymous filter function returning `true` for
   *                              entries to be updated.
   *
   * @returns {Number} The number of updted entries.
   */
  update (entityName, data, matchFunc) {
    const entity = arrayEntity(this.storage, entityName)
    let matched = 0

    this.storage[entityName] = entity.map((entry) => {
      if (matchFunc(entry)) {
        matched++
        return { ...entry, ...data }
      }
      return { ...entry }
    })

    return matched
  }

  /**
   * Delete entries on the specified (array type) entity
   *
   * @param {String}   entityName Name of the entity where to do the delete. Must
   *                              be an entity of type array, as this will behave
   *                              like a database table.
   * @param {Function} matchFunc  Annonymous filter function returning `true` for
   *                              entries to be deleted.
   *
   * @returns {Number} The number of removed entries.
   */
  delete (entityName, matchFunc) {
    const entity = arrayEntity(this.storage, entityName)
    const originalLength = entity.length

    this.storage[entityName] = entity.filter((entry) => !matchFunc(entry))

    return originalLength - this.storage[entityName].length
  }

  /**
   * Search the specified (array type) entity for results that match the given
   * filter function.
   *
   * @param {String}   entityName Name of the entity where to search. Must be
   *                              an entity of type array, as this will behave
   *                              like a database table.
   * @param {Function} filterFunc (optional) Annonymous function that returns
   *                              `true` for entries that are considered a match.
   *                              If omitted, all entries will be retrieved.
   *
   * @returns {Array} The results that match the filter function.
   */
  search (entityName, filterFunc) {
    if (!filterFunc) {
      return arrayEntity(this.storage, entityName).slice()
    }
    return arrayEntity(this.storage, entityName).filter(filterFunc)
  }

  /**
   * Test whether the specified (array type) entity has at least one result for
   * the specified filter function.
   *
   * @param {String}   entityName Name of the entity where to do the test. Must
   *                              be an entity of type array, as this will
   *                              behave like a database table search.
   * @param {Function} filterFunc Annonymous function that returns `true` for
   *                              entries that are considered a match.
   *
   * @returns {Boolean} The results that match the filter function.
   */
  testSome (entityName, filterFunc) {
    return arrayEntity(this.storage, entityName).some(filterFunc)
  }
}

/**
 * Helper method to validate whether the specified FakeDB entity is an array,
 * and retrieve a reference to its content.
 *
 * @private
 * @param   {Object} storage    Data object.
 * @param   {String} entityName Name of the entity to validate and retrive.
 *
 * @returns {Array} A reference to the entity array.
 */
const arrayEntity = (storage, entityName) => {
  if (!storage[entityName]) {
    throw new Error(`Entity “${entityName}” does not exist.`)
  }
  if (!Array.isArray(storage[entityName])) {
    throw new Error(`Entity “${entityName}” is not an array.`)
  }
  return storage[entityName]
}

/**
 * Helper function to create a promise that will resolve or reject with the
 * given value after a delay.
 *
 * _(Inspired by: https://goshakkk.name/why-i-mock-api-in-mobile-apps/)_
 *
 * **Example usage:**
 * ```js
 * return delayedPromise('my value', true, 1000)
 * ```
 *
 * @param {*}       value   Value that the promise will settle with.
 * @param {Number}  delay   Time (in ms) after which the promise should settle. _(default: `200`)_
 * @param {Boolean} success Whether the promise should resolve or be rejected. _(default: `true`)_
 *
 * @returns {Promise} The specified Promise.
 */
const delayedPromise = (value, delay, success) => {
  if (process.env.NODE_ENV === 'test') {
    delay = 0
  } else if (delay === undefined) {
    delay = 200
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success || success === undefined) {
        resolve(value)
      }
      reject(value)
    }, delay)
  })
}

/**
 * Create a promise that will resolve with the specified value after a delay.
 *
 * **Example usage:**
 * ```js
 * return fakeReply({ token: '12345' })
 * ```
 *
 * @param {*}      value Value that the promise will resolve to.
 * @param {Number} delay Time (in ms) after which the promise should resolve. _(default: `200`)_
 *
 * @returns {Promise} The specified Promise.
 */
const fakeReply = (value, delay) => {
  return delayedPromise(value, delay)
}

/**
 * Create a promise that will be rejected with the specified value after
 * after a delay.
 *
 * **Example usage:**
 * ```js
 * return fakeError('access denied')
 * ```
 *
 * @param {*}      value Value that the promise will be rejected with.
 * @param {Number} delay Time (in ms) after which the promise should be rejected. _(default: `200`)_
 *
 * @returns {Promise} The specified Promise.
 */
const fakeError = (value, delay) => {
  return delayedPromise(value, delay, false)
}

module.exports.FakeDB = FakeDB
module.exports.delayedPromise = delayedPromise
module.exports.fakeReply = fakeReply
module.exports.fakeError = fakeError
