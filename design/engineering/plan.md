# Next.js 15 Client/Server Component Separation Fix

## Problem Statement
Deployment failing because `app/[slug]/page.tsx` exports `generateMetadata` from a Client Component (`"use client"`), which violates Next.js 15 App Router rules.

## Root Cause Analysis
- `generateMetadata` can only be exported from Server Components
- The page needs client-side features (hooks, real-time, state management)
- Current architecture mixes server and client concerns in one file

## Solution Architecture

### 1. Create Component Separation
- **Server Component**: `app/[slug]/page.tsx` - handles metadata generation
- **Client Component**: `app/[slug]/note-client.tsx` - handles all client-side logic

### 2. Data Flow Pattern
```
Server Component (page.tsx)
├── generateMetadata() - SEO metadata
└── Client Component (note-client.tsx)
    ├── All hooks and state
    ├── Real-time functionality  
    └── User interactions
```

## Implementation Plan

### Phase 1: Extract Client Component
1. Create `app/[slug]/note-client.tsx`
2. Move all client logic from `page.tsx` to `note-client.tsx`
3. Keep interfaces and types accessible to both

### Phase 2: Update Server Component
1. Remove `"use client"` from `page.tsx`
2. Keep `generateMetadata` in server component
3. Import and render client component

### Phase 3: Fix Imports and Props
1. Ensure proper prop passing between server/client
2. Handle async params correctly in both components
3. Maintain existing functionality

## File Changes

### New Files
- `app/[slug]/note-client.tsx` - Client component with all hooks

### Modified Files  
- `app/[slug]/page.tsx` - Server component with metadata only

## Acceptance Criteria
- [x] Build passes without errors
- [x] `generateMetadata` works for SEO
- [x] All client functionality preserved
- [x] Real-time features still work
- [x] No runtime errors

## Risk Assessment
- **Low Risk**: Clean separation following Next.js patterns
- **No Breaking Changes**: Same user experience
- **Performance**: Potentially better (proper RSC usage)