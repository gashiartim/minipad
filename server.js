const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const SLUG_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/
const prisma = new PrismaClient()

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    socket.on('join-note', async (payload) => {
      const slug = payload && typeof payload === 'object' ? payload.slug : undefined
      const secret = payload && typeof payload === 'object' ? payload.secret : undefined

      if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return

      try {
        const note = await prisma.note.findUnique({
          where: { slug },
          select: { secret: true },
        })

        if (!note || (note.secret && note.secret !== secret)) {
          socket.emit('join-error', { slug, code: note ? 'FORBIDDEN' : 'NOT_FOUND' })
          return
        }

        console.log(`Socket ${socket.id} joined note: ${slug}`)
        socket.join(`note:${slug}`)
      } catch (err) {
        console.error('join-note failed', slug, err)
      }
    })

    socket.on('leave-note', (slug) => {
      console.log(`Socket ${socket.id} left note: ${slug}`)
      socket.leave(`note:${slug}`)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id)
    })
  })

  global.io = io

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})