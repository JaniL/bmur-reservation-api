import express from 'express'

import {
  getAllReservations,
  getUpcomingReservations,
  getPastReservations
} from './controllers/reservations'

const app = express()
const port = Number(process.env.PORT || 3000)

app.get('/reservations/all', getAllReservations)
app.get('/reservations/all/association/:association', getAllReservations)

app.get('/reservations/upcoming', getUpcomingReservations)
app.get('/reservations/past', getPastReservations)
app.get(
  '/reservations/upcoming/association/:association',
  getUpcomingReservations
)
app.get('/reservations/past/association/:association', getPastReservations)

if (require.main === module) {
  app.listen(port, () =>
    console.log(`bmur reservation api listening on port ${port}!`)
  )
}

export default app
