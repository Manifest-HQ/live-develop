import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

const app = express()
const port = process.env.PORT || 3000

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Function to recursively load routes
async function loadRoutes(directory) {
  console.log('Scanning directory:', directory)
  const entries = await fs.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      console.log('Found directory:', entry.name)
      await loadRoutes(fullPath)
    } else if (entry.name === 'index.js') {
      const route =
        fullPath
          .replace(join(__dirname, 'routes'), '')
          .replace('/index.js', '') || '/'

      console.log('Loading route:', route, 'from', fullPath)

      try {
        const module = await import(`file://${fullPath}`)
        console.log('Available methods:', Object.keys(module))

        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'ALL']
        methods.forEach((method) => {
          const upperMethod = method
          const lowerMethod = method.toLowerCase()

          if (module[upperMethod] || module[lowerMethod]) {
            const handler = module[upperMethod] || module[lowerMethod]
            console.log('Attaching', method, 'handler for', route)
            app[lowerMethod](route, handler)
          }
        })
      } catch (error) {
        console.error('Error loading route:', error)
      }
    }
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
    console.log(`Server running on port ${port}`)
  })
