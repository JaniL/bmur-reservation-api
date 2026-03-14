const axios = require('axios')
const cheerio = require('cheerio')
const { DateTime } = require('luxon')

const memoize = (() => {
  const m = require('memoizee')
  return (fn, length, promise = true) =>
    m(fn, { promise, length, maxAge: 1000 * 60 * 30, preFetch: true })
})()

const ilotalo = axios.create({
  baseURL: 'https://ilotalo.matlu.fi/'
})

const getReservations = () => {
  const parseReservations = data => {
    const getId = href => href && Number(href.split('&id=')[1])
    const parseDate = dateText => {
      const dateFormats = ['dd.MM.yyyy HH:mm:ss', 'dd.MM.yyyy HH:mm']
      const dateString = (dateText || '').trim()

      for (const dateFormat of dateFormats) {
        const parsedDate = DateTime.fromFormat(dateString, dateFormat, {
          zone: 'Europe/Helsinki'
        })

        if (parsedDate.isValid) {
          return parsedDate.toJSDate()
        }
      }

      return null
    }
    const serializeRow = (i, el) => ({
      id: getId(
        $(el)
          .children('td:nth-child(2)')
          .children('a')
          .attr('href')
      ),
      starts: parseDate(
        $(el)
          .children('td:nth-child(1)')
          .text()
      ),
      name: $(el)
        .children('td:nth-child(2)')
        .text(),
      association: $(el)
        .children('td:nth-child(3)')
        .text(),
      closed:
        $(el)
          .children('td:nth-child(4)')
          .text() === 'suljettu'
    })
    const $ = cheerio.load(data)
    const rowSelector =
      '.keyTable > table > tbody > tr, #keyTable > table > tbody > tr'

    const rows = $(rowSelector)

    return rows
      .map(serializeRow)
      .get()
      .filter(reservation => Number.isFinite(reservation.id))
  }
  return ilotalo
    .get('/index.php?page=reservation&f=3')
    .then(res => res.data)
    .then(parseReservations)
}

module.exports = {
  getReservations: memoize(getReservations)
}
