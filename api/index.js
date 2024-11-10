import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

// Add global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

const app = express()
const port = process.env.PORT || 4004

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Function to recursively load routes
async function loadRoutes(directory) {
  try {
    // console.log('Scanning directory:', directory)
    const entries = await fs.readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(directory, entry.name)

      if (entry.isDirectory()) {
        // console.log('Found directory:', entry.name)
        await loadRoutes(fullPath)
      } else if (entry.name === 'index.js') {
        const route =
          fullPath
            .replace(join(__dirname, 'routes'), '')
            .replace('/index.js', '') || '/'

        // console.log('Loading route:', route, 'from', fullPath)

        try {
          const module = await import(`file://${fullPath}`)
          // console.log('Available methods:', Object.keys(module))

          const methods = ['GET', 'POST', 'PUT', 'DELETE', 'ALL']
          methods.forEach((method) => {
            const upperMethod = method
            const lowerMethod = method.toLowerCase()

            if (module[upperMethod] || module[lowerMethod]) {
              const handler = module[upperMethod] || module[lowerMethod]
              // Adapt Vercel-style handler for Express
              app[lowerMethod](route, async (req, res) => {
                const response = await handler(req)
                const data = await response.json()
                const status = response.status || 200
                const headers = Object.fromEntries(response.headers.entries())

                res.status(status)
                Object.entries(headers).forEach(([key, value]) => {
                  res.setHeader(key, value)
                })
                res.json(data)
              })
            }
          })
        } catch (error) {
          console.error('Error loading route:', error)
        }
      }
    }
  } catch (error) {
    console.error('Error in loadRoutes:', error.stack)
    throw error
  }
}

// Move the route loading before the default route
try {
  await loadRoutes(join(__dirname, 'routes'))
  console.log('Routes loaded successfully')
} catch (error) {
  console.error('Error loading routes:', error)
}

app
  .all('*', (req, res) => {
    res.status(404).json({ details: 'Route not found' })
  })
  .listen(port, () => {
    console.log(
      `Server running on port ${port}, got to http://localhost:${port}`
    )
  })
  .on('error', (error) => {
    console.error('Server startup error:', error)
    process.exit(1)
  })
