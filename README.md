# Local Notepad - Production Ready

A robust, secure, local-only web application for creating and managing text notes with image attachments. Built with enterprise-grade features including comprehensive testing, security hardening, and operational tooling.

## Features

### Core Features
- **Local-only**: No external services, runs entirely on your local network
- **Simple notes**: Create notes with slugs, optional password protection
- **Image support**: Upload and attach images (PNG, JPEG, WebP, GIF)
- **Auto-save**: Automatic saving with debounce and visual feedback
- **Keyboard shortcuts**: Ctrl/Cmd+S to save, Ctrl/Cmd+Enter to create
- **Responsive design**: Works on desktop and mobile with skeleton loading

### Production Features
- **TypeScript strict mode**: Full type safety and compile-time error checking
- **Rate limiting**: IP-based request limiting with mutex locks for concurrent writes
- **Security hardening**: Comprehensive security headers, input sanitization, and validation
- **Content sanitization**: XSS protection with script/iframe removal
- **Enhanced UI/UX**: Progress indicators, toast notifications, drag-and-drop feedback
- **Comprehensive testing**: Unit, integration, and end-to-end test suites
- **Backup & maintenance**: Database backup/restore, export tools, cleanup utilities

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript strict mode
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Database**: Prisma ORM with SQLite
- **Testing**: Jest + Testing Library + Playwright
- **Security**: Zod validation, rate limiting, content sanitization
- **Storage**: Local file system with organized uploads directory

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

2. **Initialize database:**
   \`\`\`bash
   npm run db:push
   \`\`\`

3. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

### Creating Notes
- Go to the homepage
- Enter a slug (optional, 3-64 characters) and secret (optional, 6-128 characters)
- Click "Create" or press Ctrl/Cmd+Enter
- Auto-generated slug if none provided

### Editing Notes
- Open a note by slug or create new one
- Edit content in the textarea (supports up to 200,000 characters)
- Auto-save enabled by default (1.5s delay after typing stops)
- Manual save with Ctrl/Cmd+S or the Save button
- Visual indicators for unsaved changes and save status

### Image Management
- Drag and drop images onto the upload area with visual feedback
- Or click to select files from your computer
- Supports PNG, JPEG, WebP, GIF up to 10MB each
- Images stored locally in `./data/uploads` with secure filename generation
- Gallery view with metadata (size, dimensions, upload date)
- Click images to open in new tab

### Security Features
- Notes can be protected with a secret (6-128 characters)
- Secret required for editing and uploading images to protected notes
- Rate limiting: 60 requests per 5 minutes per IP address
- Content sanitization removes scripts, iframes, and event handlers
- Path traversal protection and filename validation
- Security headers prevent XSS, clickjacking, and other attacks

## Development Scripts

### Core Scripts
\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
\`\`\`

### Testing Scripts
\`\`\`bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run end-to-end tests
npm run test:e2e:ui  # Run E2E tests with UI
\`\`\`

### Database Scripts
\`\`\`bash
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client
\`\`\`

### Maintenance Scripts
\`\`\`bash
npm run backup       # Create database backup
npm run restore      # Restore from backup file
npm run export       # Export notes as Markdown
npm run cleanup      # Clean up orphaned images
npm run stats        # Show database statistics
\`\`\`

## File Structure

\`\`\`
/app
  /(public)/i/[file]/route.ts    # Secure image serving with validation
  /api/notes/route.ts            # Create notes with rate limiting
  /api/notes/[slug]/route.ts     # Get/update notes with mutex locks
  /api/notes/[slug]/images/route.ts # Image upload with validation
  /[slug]/page.tsx               # Note editor with enhanced UX
  /page.tsx                      # Homepage with improved design
/components
  /ui/                           # shadcn/ui components + custom additions
  /image-upload.tsx              # Enhanced drag-and-drop upload
  /image-gallery.tsx             # Image gallery with metadata
/lib
  /db.ts                         # Database connection
  /validators.ts                 # Enhanced Zod schemas with sanitization
  /utils.ts                      # Utility functions
  /api-middleware.ts             # Security middleware and error handling
  /rate-limiter.ts               # Rate limiting and mutex implementation
/scripts
  /backup-database.ts            # Database backup utility
  /restore-database.ts           # Database restore utility
  /export-notes.ts               # Markdown export tool
  /cleanup-orphaned-images.ts    # Maintenance cleanup
  /database-stats.ts             # Statistics generator
/__tests__
  /lib/                          # Unit tests for utilities
  /api/                          # API route tests
  /components/                   # Component tests
/e2e
  /note-creation.spec.ts         # E2E tests for note creation
  /note-editing.spec.ts          # E2E tests for editing workflow
/data
  /app.db                        # SQLite database
  /uploads/                      # Secure image storage
/backups                         # Database backups
/exports                         # Markdown exports
\`\`\`

## API Endpoints

### Notes API
- `POST /api/notes` - Create note (rate limited)
- `GET /api/notes/[slug]` - Get note with images
- `PUT /api/notes/[slug]` - Update note (with mutex lock)

### Images API
- `POST /api/notes/[slug]/images` - Upload image (rate limited)
- `GET /i/[filename]` - Serve image (with caching headers)

### Security Features
- Request logging and error tracking
- Rate limiting headers in responses
- ETag support for efficient caching
- Content-Type validation and security headers

## Environment Variables

Optional variables in `.env.local`:

\`\`\`env
# Server Configuration
HOST=0.0.0.0
PORT=3000
NEXT_PRIVATE_NO_CACHE=1

# Database (automatically configured)
DATABASE_URL="file:./data/app.db"

# Development (optional)
NODE_ENV=development
\`\`\`

## Production Deployment

### Local Network Deployment

1. **Build the application:**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start production server:**
   \`\`\`bash
   npm start
   \`\`\`

3. **Access from network:**
   The app will be available at `http://[your-ip]:3000` on your local network.

### Docker Deployment (Optional)

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Backup Strategy

1. **Automated backups:**
   \`\`\`bash
   # Create daily backup
   npm run backup
   \`\`\`

2. **Export for portability:**
   \`\`\`bash
   # Export as Markdown files
   npm run export
   \`\`\`

3. **Restore from backup:**
   \`\`\`bash
   # Restore specific backup
   npm run restore backup-2024-01-01T12-00-00-000Z.json
   \`\`\`

## Security Architecture

### Input Validation
- Zod schemas with strict validation rules
- Content sanitization removes malicious scripts
- File type and size validation for uploads
- Path traversal prevention

### Rate Limiting
- IP-based request limiting (60 requests per 5 minutes)
- Mutex locks prevent concurrent writes to same note
- Graceful degradation with proper error messages

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- Permissions-Policy restrictions

### Data Protection
- Local-only storage (no external connections)
- Optional password protection for notes
- Secure filename generation for uploads
- Database integrity with foreign key constraints

## Testing Strategy

### Unit Tests
- Validators and utility functions
- Rate limiting and security middleware
- Database operations and error handling

### Integration Tests
- API endpoints with mocked database
- File upload and validation workflows
- Error scenarios and edge cases

### End-to-End Tests
- Complete user workflows (create, edit, save)
- Image upload and gallery functionality
- Keyboard shortcuts and auto-save behavior
- Cross-browser compatibility testing

### Coverage Requirements
- Minimum 70% coverage for branches, functions, lines, and statements
- Critical paths have 100% coverage
- Security functions thoroughly tested

## Maintenance & Operations

### Database Maintenance
\`\`\`bash
# View database statistics
npm run stats

# Clean up orphaned files
npm run cleanup

# Create backup before maintenance
npm run backup
\`\`\`

### Monitoring
- Request logging with timing information
- Error tracking and categorization
- File system usage monitoring
- Database performance metrics

### Troubleshooting

#### Common Issues

1. **Database locked error:**
   \`\`\`bash
   # Stop the server and restart
   npm run dev
   \`\`\`

2. **Missing images:**
   \`\`\`bash
   # Clean up orphaned records
   npm run cleanup
   \`\`\`

3. **High disk usage:**
   \`\`\`bash
   # Check statistics and clean up
   npm run stats
   npm run cleanup
   \`\`\`

4. **Rate limit errors:**
   - Wait 5 minutes for rate limit reset
   - Check for automated scripts hitting the API

#### Performance Optimization

1. **Database optimization:**
   - Regular cleanup of orphaned images
   - Monitor database size growth
   - Consider archiving old notes

2. **File system optimization:**
   - Regular cleanup of unused uploads
   - Monitor disk space usage
   - Implement log rotation

## Contributing

### Development Setup
1. Fork the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Start development server: `npm run dev`

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Comprehensive test coverage required
- Security-first development approach

### Pull Request Process
1. Ensure all tests pass
2. Update documentation as needed
3. Follow security best practices
4. Include appropriate test coverage

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v2.0.0 - Production Ready
- Added TypeScript strict mode and comprehensive type safety
- Implemented rate limiting and security hardening
- Enhanced UI/UX with skeleton loaders and progress indicators
- Added comprehensive testing suite (unit, integration, E2E)
- Created backup and maintenance tooling
- Improved error handling and logging
- Added content sanitization and XSS protection

### v1.0.0 - Initial Release
- Basic note creation and editing
- Image upload functionality
- Local SQLite storage
- Simple responsive design
