# Testing Plan for Socket.IO Real-time Functionality

## Overview

This document outlines the comprehensive testing strategy for the Socket.IO-based real-time note synchronization feature.

## Test Coverage Areas

### 1. Unit Tests
**Location**: `__tests__/lib/`

#### Socket.IO Server Utilities (`socket.test.ts`)
- ✅ `getSocketIO()` - Returns global Socket.IO instance
- ✅ `broadcastNoteUpdate()` - Broadcasts to correct rooms
- ✅ Error handling when Socket.IO not initialized
- ✅ Different update types (content_update, heartbeat, connected)

#### Socket.IO Client Utilities (`socket-client.test.ts`)
- ✅ `getSocket()` - Creates client with correct config
- ✅ Singleton pattern - returns same instance
- ✅ Connection configuration (path, CORS)

### 2. Integration Tests
**Location**: `__tests__/hooks/` and `__tests__/api/`

#### Real-time Hook (`use-realtime-note-socket.test.tsx`)
- ✅ Socket event listener setup/cleanup
- ✅ Connection state management
- ✅ Room joining/leaving logic
- ✅ Update handling and callback execution
- ✅ Enabled/disabled state transitions
- ✅ Slug changes and room switching

#### API with Broadcasting (`notes-socket.test.ts`)
- ✅ Socket.IO broadcast on successful note updates
- ✅ No broadcast when content unchanged
- ✅ No broadcast on update failures
- ✅ Correct data format in broadcasts
- ✅ Protected notes with secrets

### 3. End-to-End Tests
**Location**: `e2e/realtime-sync.spec.ts`

#### Multi-Browser Synchronization
- ✅ Content sync across browser instances
- ✅ Connection status indicators
- ✅ Concurrent edit conflict resolution
- ✅ Connection persistence across refreshes
- ✅ Multiple users (3+ browsers) simultaneously
- ✅ API-triggered updates via Socket.IO

## Test Commands

### Run All Tests
```bash
# Unit and integration tests
pnpm test

# E2E tests
pnpm playwright test

# Specific test files
pnpm test socket.test.ts
pnpm playwright test realtime-sync.spec.ts
```

### Test Coverage
```bash
# Generate coverage report
pnpm test --coverage

# Coverage thresholds (jest.config.js):
# - Branches: 70%
# - Functions: 70%
# - Lines: 70%
# - Statements: 70%
```

### Debug Tests
```bash
# Debug unit tests
pnpm test --verbose

# Debug E2E tests with UI
pnpm playwright test --ui

# Run E2E tests in headed mode
pnpm playwright test --headed
```

## Test Environment Setup

### Prerequisites
- Node.js server running on port 3000
- PostgreSQL database (test instance)
- Socket.IO server initialized

### Test Data
- Dynamic test slugs using timestamps to avoid conflicts
- Isolated browser contexts for multi-user scenarios
- Mocked dependencies for unit tests

### CI/CD Considerations
- Tests run in isolated environments
- Database seeded with test data
- Socket.IO connections properly cleaned up
- Parallel test execution limited to prevent conflicts

## Coverage Goals

### Critical Paths
1. **Real-time synchronization** - 100% covered
2. **Socket.IO broadcasting** - 100% covered
3. **Connection management** - 95% covered
4. **Error handling** - 90% covered

### Performance Benchmarks
- Socket.IO broadcast latency: < 100ms
- Connection establishment: < 2s
- Multi-user sync: < 500ms

## Test Scenarios

### Happy Path
- ✅ User opens note → connects → receives updates
- ✅ User edits note → auto-saves → broadcasts to others
- ✅ Multiple users edit simultaneously → all see updates

### Error Scenarios
- ✅ Socket.IO server not available → graceful degradation
- ✅ Network interruption → reconnection handling
- ✅ Concurrent edits → conflict resolution

### Edge Cases
- ✅ Rapid consecutive updates → throttling/debouncing
- ✅ Large content updates → performance handling
- ✅ Browser tab switching → connection management

## Monitoring and Alerting

### Test Metrics
- Test execution time
- Flaky test detection
- Coverage trend monitoring

### Production Monitoring
- Socket.IO connection counts
- Broadcast success rates
- Real-time update latency

## Future Test Enhancements

### Planned Additions
- [ ] Load testing with 100+ concurrent connections
- [ ] Network condition simulation (slow/intermittent)
- [ ] Mobile browser compatibility tests
- [ ] Accessibility testing for real-time features

### Test Infrastructure
- [ ] Test data factories for consistent test setup
- [ ] Custom Playwright fixtures for Socket.IO testing
- [ ] Performance regression testing
- [ ] Visual regression testing for connection indicators

---

## Quick Reference

**Run Socket.IO Tests**:
```bash
pnpm test socket
pnpm playwright test realtime-sync
```

**Debug Real-time Issues**:
1. Check browser console for Socket.IO connection logs
2. Verify server logs show "Socket connected" messages
3. Test with `curl` to ensure API broadcasts work
4. Use Playwright trace viewer for E2E debugging

**Test Coverage Report**: `coverage/lcov-report/index.html`