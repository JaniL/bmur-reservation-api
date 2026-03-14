const nock = require('nock')
const request = require('supertest')

const formatDate = date => {
  const pad = value => String(value).padStart(2, '0')
  return (
    [pad(date.getDate()), pad(date.getMonth() + 1), date.getFullYear()].join(
      '.'
    ) +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`
  )
}

const createFixture = ({ pastDate, futureDate }) => `
<div class="keyTable">
  <table class="keys" border="0" cellpadding="5" cellspacing="5">
    <tbody>
      <tr>
        <th>Ajankohta</th>
        <th>Varaus</th>
        <th>Jarjesto</th>
        <th>Avoimuus</th>
      </tr>
      <tr class="closed">
        <td>${formatDate(pastDate)}</td>
        <td><a href="index.php?page=res&id=1001" class="eventlink">Past event</a></td>
        <td>Matlu</td>
        <td>suljettu</td>
      </tr>
      <tr class="open">
        <td>${formatDate(futureDate)}</td>
        <td><a href="index.php?page=res&id=1002" class="eventlink">Future event</a></td>
        <td>Resonanssi</td>
        <td>avoin</td>
      </tr>
    </tbody>
  </table>
</div>
`

const loadFreshApp = () => {
  const integrationPath = require.resolve('../../app/integrations/ilotalo.js')
  const controllerPath = require.resolve(
    '../../app/controllers/reservations.js'
  )
  const serverPath = require.resolve('../../app/server.js')

  delete require.cache[integrationPath]
  delete require.cache[controllerPath]
  delete require.cache[serverPath]

  return require('../../app/server.js')
}

describe('reservation endpoints', () => {
  beforeEach(() => {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('returns all reservations and supports association filtering', async () => {
    const now = new Date()
    const fixture = createFixture({
      pastDate: new Date(now.getTime() - 60 * 60 * 1000),
      futureDate: new Date(now.getTime() + 60 * 60 * 1000)
    })

    nock('https://ilotalo.matlu.fi')
      .get('/index.php?page=reservation&f=3')
      .reply(200, fixture)

    const app = loadFreshApp()
    const allResponse = await request(app).get('/reservations/all')

    expect(allResponse.status).toBe(200)
    expect(allResponse.body).toHaveLength(2)

    const associationResponse = await request(app).get(
      '/reservations/all/association/matlu'
    )
    expect(associationResponse.status).toBe(200)
    expect(associationResponse.body).toHaveLength(1)
    expect(associationResponse.body[0].association).toBe('Matlu')
  })

  it('splits reservations into upcoming and past collections', async () => {
    const now = new Date()
    const fixture = createFixture({
      pastDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      futureDate: new Date(now.getTime() + 2 * 60 * 60 * 1000)
    })

    nock('https://ilotalo.matlu.fi')
      .get('/index.php?page=reservation&f=3')
      .reply(200, fixture)

    const app = loadFreshApp()
    const upcomingResponse = await request(app).get('/reservations/upcoming')
    const pastResponse = await request(app).get('/reservations/past')

    expect(upcomingResponse.status).toBe(200)
    expect(upcomingResponse.body).toHaveLength(1)
    expect(upcomingResponse.body[0].id).toBe(1002)

    expect(pastResponse.status).toBe(200)
    expect(pastResponse.body).toHaveLength(1)
    expect(pastResponse.body[0].id).toBe(1001)
  })

  it('returns a 502 response when upstream fetch fails', async () => {
    nock('https://ilotalo.matlu.fi')
      .get('/index.php?page=reservation&f=3')
      .reply(500, 'upstream error')

    const app = loadFreshApp()
    const response = await request(app).get('/reservations/all')

    expect(response.status).toBe(502)
    expect(response.body).toMatchObject({
      error: 'Failed to fetch reservations from upstream service'
    })
  })
})
