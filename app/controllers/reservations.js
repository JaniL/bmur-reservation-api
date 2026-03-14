const ilotalo = require('../integrations/ilotalo')

const filterUpcoming = reservations =>
  reservations.filter(r => r.starts && r.starts >= new Date())
const filterPast = reservations =>
  reservations.filter(r => r.starts && r.starts <= new Date())
const filterByAssociation = association => reservations =>
  reservations.filter(
    r => r.association.toLowerCase() === association.toLowerCase()
  )

const maybeFilterByAssociation = association => reservations =>
  association ? filterByAssociation(association)(reservations) : reservations

const handleReservationsError = res => error => {
  res.status(502).json({
    error: 'Failed to fetch reservations from upstream service',
    detail: error && error.message ? error.message : 'Unknown error'
  })
}

const getAllReservations = (req, res) =>
  ilotalo
    .getReservations()
    .then(maybeFilterByAssociation(req.params.association))
    .then(reservations => res.json(reservations))
    .catch(handleReservationsError(res))

const getUpcomingReservations = (req, res) =>
  ilotalo
    .getReservations()
    .then(filterUpcoming)
    .then(maybeFilterByAssociation(req.params.association))
    .then(reservations => res.json(reservations))
    .catch(handleReservationsError(res))

const getPastReservations = (req, res) =>
  ilotalo
    .getReservations()
    .then(filterPast)
    .then(maybeFilterByAssociation(req.params.association))
    .then(reservations => res.json(reservations))
    .catch(handleReservationsError(res))

module.exports = {
  getAllReservations,
  getUpcomingReservations,
  getPastReservations
}
