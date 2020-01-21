const pgPromise = require('pg-promise')
var faker = require('faker');

const getDb = () => {
  const pgp = pgPromise({ noWarnings: true })
  const db = pgp({
    host: 'database',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
  })
  return { db, pgp }
}

const getRandomNameStartingWith = char => {
  let name = ''
  while (name[0] !== char) {
    name = faker.name.findName()
  }
  return { first: name.split(' ')[0], last: name.split(' ')[1] }
}

const writeRowsToDb = rows => db.tx(async t => {
  await t.result('DELETE FROM names')
  const insertSql = pgp.helpers.insert(rows, columnSet)
  await t.result(insertSql)
})

;(async () => {
  await Promise.all(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => {
      const { db, pgp } = getDb()
      const rows = [...Array(100)].map(val => getRandomNameStartingWith(char))
      const columnSet = new pgp.helpers.ColumnSet(
        [ 'first', 'last' ],
        { table: 'names' }
      )
      return db.tx(async t => {
        await t.result('LOCK names')
        await t.result('DELETE FROM names')
        const insertSql = pgp.helpers.insert(rows, columnSet)
        await t.result(insertSql)
      })
    })
  )
  console.log('Finished writing database transactions!')
  process.exit(0)
})()
