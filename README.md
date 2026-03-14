# bmur-reservation-api

REST-like API for retrieving Christina Regina reservation data from ilotalo.matlu.fi.

## Maintenance status

This project is **not actively maintained**. Community fixes are welcome, but expect slow response times.

## Requirements

- Node.js `>=20`
- Yarn classic (`1.x`)

## Install

```bash
yarn install
```

## Development

Run directly from TypeScript sources:

```bash
yarn dev
```

## Build and run

Build to `dist/`:

```bash
yarn build
```

Start compiled server:

```bash
yarn start
```

## Test

Tests are deterministic and use mocked upstream responses.

```bash
yarn test
```

## Live smoke check

Optional smoke check against the live upstream service:

```bash
yarn smoke
```

This command starts a local server, queries core endpoints, prints item counts, and exits.

## API endpoints

- `GET /reservations/all`
- `GET /reservations/all/association/:association`
- `GET /reservations/upcoming`
- `GET /reservations/upcoming/association/:association`
- `GET /reservations/past`
- `GET /reservations/past/association/:association`

## Docker

A Dockerfile is included and builds TypeScript before starting `dist/server.js`.
