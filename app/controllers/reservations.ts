import type { Request, Response } from 'express'

import { getReservations, type Reservation } from '../integrations/ilotalo'

const filterUpcoming = (reservations: Reservation[]): Reservation[] =>
  reservations.filter(reservation =>
    Boolean(reservation.starts && reservation.starts >= new Date())
  )

const filterPast = (reservations: Reservation[]): Reservation[] =>
  reservations.filter(reservation =>
    Boolean(reservation.starts && reservation.starts <= new Date())
  )

const filterByAssociation =
  (association: string) =>
  (reservations: Reservation[]): Reservation[] =>
    reservations.filter(
      reservation =>
        reservation.association.toLowerCase() === association.toLowerCase()
    )

const maybeFilterByAssociation =
  (association: string | undefined) =>
  (reservations: Reservation[]): Reservation[] =>
    association ? filterByAssociation(association)(reservations) : reservations

const readAssociationParam = (req: Request): string | undefined => {
  const association = req.params.association
  return Array.isArray(association) ? association[0] : association
}

const handleReservationsError =
  (res: Response) =>
  (error: unknown): void => {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    res.status(502).json({
      error: 'Failed to fetch reservations from upstream service',
      detail
    })
  }

export const getAllReservations = (req: Request, res: Response): void => {
  getReservations()
    .then(maybeFilterByAssociation(readAssociationParam(req)))
    .then(reservations => res.json(reservations))
    .catch(handleReservationsError(res))
}

export const getUpcomingReservations = (req: Request, res: Response): void => {
  getReservations()
    .then(filterUpcoming)
    .then(maybeFilterByAssociation(readAssociationParam(req)))
    .then(reservations => res.json(reservations))
    .catch(handleReservationsError(res))
}

export const getPastReservations = (req: Request, res: Response): void => {
  getReservations()
    .then(filterPast)
    .then(maybeFilterByAssociation(readAssociationParam(req)))
    .then(reservations => res.json(reservations))
    .catch(handleReservationsError(res))
}
