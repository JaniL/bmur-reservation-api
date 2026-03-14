const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const {
  getAllReservations,
  getUpcomingReservations,
  getPastReservations
} = require('./controllers/reservations')

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

module.exports = app
