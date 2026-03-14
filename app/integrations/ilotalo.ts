import axios from 'axios'
import * as cheerio from 'cheerio'
import { DateTime } from 'luxon'
import memoizee from 'memoizee'

export type Reservation = {
  id: number
  starts: Date | null
  name: string
  association: string
  closed: boolean
}

const ilotalo = axios.create({
  baseURL: 'https://ilotalo.matlu.fi/'
})

const getId = (href: string | undefined): number | null => {
  if (!href || !href.includes('&id=')) {
    return null
  }

  const parsedId = Number(href.split('&id=')[1])
  return Number.isFinite(parsedId) ? parsedId : null
}

const parseDate = (dateText: string): Date | null => {
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

const parseReservations = (data: string): Reservation[] => {
  const $ = cheerio.load(data)
  const rowSelector =
    '.keyTable > table > tbody > tr, #keyTable > table > tbody > tr'
  const rows = $(rowSelector)
  const reservations: Reservation[] = []

  rows.each((_, row) => {
    const id = getId(
      $(row)
        .children('td:nth-child(2)')
        .children('a')
        .attr('href')
    )

    if (id === null) {
      return
    }

    reservations.push({
      id,
      starts: parseDate(
        $(row)
          .children('td:nth-child(1)')
          .text()
      ),
      name: $(row)
        .children('td:nth-child(2)')
        .text(),
      association: $(row)
        .children('td:nth-child(3)')
        .text(),
      closed:
        $(row)
          .children('td:nth-child(4)')
          .text() === 'suljettu'
    })
  })

  return reservations
}

const fetchReservations = (): Promise<Reservation[]> =>
  ilotalo
    .get('/index.php?page=reservation&f=3')
    .then(response => response.data)
    .then(parseReservations)

export const getReservations: () => Promise<Reservation[]> = memoizee(
  fetchReservations,
  {
    promise: true,
    maxAge: 1000 * 60 * 30,
    preFetch: true
  }
)
