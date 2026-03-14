const { spawn } = require('child_process')

const port = process.env.PORT || '3100'
const baseUrl = `http://127.0.0.1:${port}`

const waitForServer = async (attempts = 20) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/reservations/all`)
      if (response.ok) {
        return
      }
    } catch (error) {
      // retry
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error('Server did not become ready in time')
}

const getCount = async endpoint => {
  const response = await fetch(`${baseUrl}${endpoint}`)

  if (!response.ok) {
    throw new Error(
      `Request failed for ${endpoint} with status ${response.status}`
    )
  }

  const payload = await response.json()
  return Array.isArray(payload) ? payload.length : null
}

const server = spawn('node', ['app/server.js'], {
  env: {
    ...process.env,
    PORT: String(port)
  },
  stdio: ['ignore', 'pipe', 'pipe']
})

server.stdout.on('data', chunk => {
  process.stdout.write(chunk)
})

server.stderr.on('data', chunk => {
  process.stderr.write(chunk)
})

const cleanup = () => {
  if (!server.killed) {
    server.kill('SIGTERM')
  }
}

const run = async () => {
  await waitForServer()

  const endpoints = [
    '/reservations/all',
    '/reservations/upcoming',
    '/reservations/past',
    '/reservations/all/association/Matlu'
  ]

  for (const endpoint of endpoints) {
    const count = await getCount(endpoint)
    console.log(`${endpoint}: ${count}`)
  }
}

run()
  .then(() => {
    cleanup()
  })
  .catch(error => {
    cleanup()
    console.error(error.message)
    process.exitCode = 1
  })

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
