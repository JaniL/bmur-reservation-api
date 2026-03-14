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

const getAllReservations = (req, res) =>
  ilotalo
    .getReservations()
    .then(maybeFilterByAssociation(req.params.association))
    .then(reservations => res.json(reservations))

const getUpcomingReservations = (req, res) =>
  ilotalo
    .getReservations()
    .then(filterUpcoming)
    .then(maybeFilterByAssociation(req.params.association))
    .then(reservations => res.json(reservations))

const getPastReservations = (req, res) =>
  ilotalo
    .getReservations()
    .then(filterPast)
    .then(maybeFilterByAssociation(req.params.association))
    .then(reservations => res.json(reservations))

module.exports = {
  getAllReservations,
  getUpcomingReservations,
  getPastReservations
}
