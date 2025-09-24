# WebSocket Connection Loop Fix

## Problem Statement
WebSocket is reconnecting on every keystroke due to dependency issues in the `useRealtimeNoteSocket` hook, causing performance issues and excessive server connections.

## Root Cause Analysis
1. **useEffect dependencies**: Include callback functions that change on every render
2. **onUpdate callback**: Recreated on every state change due to dependencies
3. **State changes**: Every keystroke changes `contentRich`, `hasUnsavedChanges`, etc.
4. **Hook re-execution**: Dependency changes cause cleanup and reconnection

## Current Flow (Problematic):
```
Keystroke → State Change → Callback Recreation → Hook Re-run → Socket Disconnect → Socket Reconnect
```

## Target Flow (Fixed):
```
Initial Load → Socket Connect → Stay Connected → Handle Updates
```

## Solution Strategy

### 1. Fix Hook Dependencies
- Remove callback functions from useEffect dependencies
- Use useCallback with stable dependencies
- Memoize the onUpdate callback properly

### 2. Optimize Callback Stability
- Use refs for frequently changing values
- Separate connection logic from update handling
- Remove state dependencies where possible

### 3. Connection Management
- Connect once on mount
- Only reconnect when truly necessary (slug/auth changes)
- Maintain connection through content updates

## Implementation Steps

1. **Fix useRealtimeNoteSocket hook dependencies**
2. **Optimize onUpdate callback in note-client**
3. **Test connection stability**
4. **Remove debug logs**

## Acceptance Criteria
- [ ] Socket connects once per page load
- [ ] No reconnections during typing
- [ ] Real-time updates still work
- [ ] Connection properly cleanup on unmount
- [ ] Performance improved (no connection spam)