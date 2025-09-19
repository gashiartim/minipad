# Implementation Notes

## Docker Configuration Update for Socket.IO

Updated Dockerfile to copy our custom `server.js` file to the production image. This ensures that the Socket.IO server runs correctly in production with our custom Node.js server instead of the default Next.js server. The entrypoint script already runs `node server.js` so no changes needed there.

**Change**: Added `COPY --from=builder /app/server.js ./` to Dockerfile to include our Socket.IO-enabled server in production builds.

**Impact**: Real-time WebSocket functionality will now work in production Docker deployments.