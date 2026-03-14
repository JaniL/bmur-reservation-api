const fs = require('fs')
const path = require('path')
const nock = require('nock')

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  'fixtures',
  'ilotalo-mixed-dates.html'
)

const loadFreshIlotalo = () => {
  const modulePath = path.join(
    __dirname,
    '..',
    '..',
    'app',
    'integrations',
    'ilotalo.js'
  )
  delete require.cache[require.resolve(modulePath)]
  return require(modulePath)
}

describe('ilotalo integration', () => {
  beforeEach(() => {
    nock.disableNetConnect()
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('parses reservations using second and minute precision date formats', async () => {
    const fixture = fs.readFileSync(FIXTURE_PATH, 'utf8')
    nock('https://ilotalo.matlu.fi')
      .get('/index.php?page=reservation&f=3')
      .reply(200, fixture)

    const ilotalo = loadFreshIlotalo()
    const reservations = await ilotalo.getReservations()

    expect(reservations).toHaveLength(2)
    expect(reservations[0]).toMatchObject({
      id: 1669,
      name: 'Matrix-leffailta',
      association: 'Matrix',
      closed: true
    })
    expect(reservations[1]).toMatchObject({
      id: 3,
      name: 'Leppiskokous',
      association: 'Matlu',
      closed: false
    })
    expect(reservations[0].starts).toBeInstanceOf(Date)
    expect(reservations[1].starts).toBeInstanceOf(Date)
    expect(Number.isNaN(reservations[0].starts.getTime())).toBe(false)
    expect(Number.isNaN(reservations[1].starts.getTime())).toBe(false)
  })

  it('ignores non-reservation rows without reservation id links', async () => {
    const fixture = fs.readFileSync(FIXTURE_PATH, 'utf8')
    nock('https://ilotalo.matlu.fi')
      .get('/index.php?page=reservation&f=3')
      .reply(200, fixture)

    const ilotalo = loadFreshIlotalo()
    const reservations = await ilotalo.getReservations()

    expect(reservations.every(r => Number.isFinite(r.id))).toBe(true)
  })
})
