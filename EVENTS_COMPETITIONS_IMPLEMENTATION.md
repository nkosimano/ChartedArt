# Events & Competitions Feature - Implementation Guide

## Overview

This document describes the complete implementation of the Events & Competitions feature for both web and mobile platforms. The feature allows users to browse events, register for competitions, submit artwork, and view winners.

## Architecture

### Database Schema

The feature uses the following tables (defined in `supabase/migrations/20251016_003_events_competitions.sql`):

1. **events** - Extended with competition-specific fields
   - `event_type`: competition, workshop, fundraiser, exhibition, meetup
   - `entry_fee`, `prize_pool`, `prizes` (JSONB)
   - `registration_deadline`, `capacity`
   - `rules_and_guidelines`, `cover_image`

2. **event_registrations** - User registrations for events
   - Links users to events
   - Tracks payment status and registration type

3. **competition_submissions** - Artwork submissions
   - Secure file upload with S3
   - Scoring and ranking system
   - Award tracking (1st, 2nd, 3rd place)

4. **competition_judges** - Judge assignments
5. **judge_scores** - Individual judge scores
6. **submission_upload_requests** - Secure upload tracking

### API Endpoints

#### Web & Mobile API Client Extensions

**Events Endpoints** (`src/lib/api/client.ts` & `mobile/src/lib/api/client.ts`):
- `GET /events` - List all published events
- `GET /events/:id` - Get event details
- `POST /events/:id/register` - Register for an event
- `GET /events/registrations/me` - Get user's registrations

**Submissions Endpoints**:
- `POST /events/:id/submissions/upload-request` - Request secure upload URL
- `POST /events/:id/submissions/:submissionId/confirm` - Confirm submission
- `GET /events/:id/submissions` - List event submissions
- `GET /events/:id/submissions/me` - Get user's submissions
- `PUT /events/:id/submissions/:submissionId` - Update submission
- `DELETE /events/:id/submissions/:submissionId` - Delete submission

## Web Implementation

### Pages

#### 1. EventsPage (`src/pages/EventsPage.tsx`)
**Route**: `/events`

**Features**:
- Grid view of all upcoming events
- Search functionality
- Filter by event type (all, competition, workshop, fundraiser, exhibition)
- Responsive design with animations
- Real-time data from Supabase

**Components Used**:
- `EventCard` - Individual event card with cover image, badges, and details

#### 2. EventDetailPage (`src/pages/EventDetailPage.tsx`)
**Route**: `/events/:id`

**Features**:
- Full event details with hero image
- Event information sidebar (date, location, capacity, fees, prizes)
- Registration status banner
- Rules and guidelines section
- Prize breakdown
- Submission gallery for competitions
- Register/Submit buttons based on user status

**Components Used**:
- `SubmissionGallery` - Display approved submissions with winner highlights

#### 3. EventSubmissionPage (`src/pages/EventSubmissionPage.tsx`)
**Route**: `/events/:id/submit`

**Features**:
- Multi-step submission process
- Eligibility checking (must be registered)
- Deadline validation
- Secure file upload flow

**Components Used**:
- `SubmissionForm` - Complete submission workflow

### Components

#### EventCard (`src/components/events/EventCard.tsx`)
Displays event summary with:
- Cover image with fallback
- Event type badge (color-coded)
- Deadline warning badge
- Event details (date, location, capacity)
- Prize pool and entry fee for competitions
- Hover animations

#### SubmissionForm (`src/components/events/SubmissionForm.tsx`)
Multi-step form with:
1. **Upload Step**: File selection with drag-and-drop
2. **Details Step**: Title and description input
3. **Confirm Step**: Success message

**Features**:
- File validation (type, size)
- Image preview
- Progress indicators
- Error handling
- Secure S3 upload via presigned URLs

#### SubmissionGallery (`src/components/events/SubmissionGallery.tsx`)
Gallery display with:
- Winner section (1st, 2nd, 3rd place)
- Award badges with icons
- Lightbox modal for full-size viewing
- Optional public voting
- Score display

### Routing

Updated `src/App.tsx` with new routes:
```tsx
<Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
<Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
<Route path="/events/:id/submit" element={<ProtectedRoute><EventSubmissionPage /></ProtectedRoute>} />
```

## Mobile Implementation

### Screens

#### 1. EventListScreen (`mobile/src/screens/events/EventListScreen.tsx`)
**Navigation**: `MainTabs > Events`

**Features**:
- Native list with pull-to-refresh
- Search bar with icon
- Horizontal filter chips
- Event cards with images
- Deadline badges
- Empty state handling
- Loading states

**UI Elements**:
- Search input with icon
- Filter buttons (horizontal scroll)
- Event cards with cover images
- Type badges (color-coded)
- Deadline warnings

#### 2. EventDetailScreen (`mobile/src/screens/events/EventDetailScreen.tsx`)
**Navigation**: `EventList > EventDetail`

**Features**:
- Full-screen cover image with overlay
- Back button
- Registration status banner
- Scrollable content
- Event information cards
- Rules and guidelines
- Prize breakdown
- Sticky register/submit button

**UI Elements**:
- Hero image with gradient overlay
- Info rows with icons
- Registration banner (green)
- Prize cards
- Action buttons in footer

#### 3. SubmissionScreen (`mobile/src/screens/events/SubmissionScreen.tsx`)
**Navigation**: `EventDetail > EventSubmission`

**Features**:
- Multi-step wizard (Upload → Details → Confirm)
- Native image picker integration
- Camera support
- Background upload with progress
- File size validation
- Upload progress overlay
- Success confirmation

**Native Features**:
- `expo-image-picker` for gallery and camera
- `expo-file-system` for file operations
- Permission requests (camera, photo library)
- Progress tracking
- Background upload capability

### Components

#### WinnerBadge (`mobile/src/components/events/WinnerBadge.tsx`)
Displays competition wins on user profile:
- Place indicator (1st, 2nd, 3rd with emojis)
- Event title
- Prize amount
- Event date
- Color-coded by place
- Touchable for navigation

### Navigation Updates

#### MainTabs (`mobile/src/navigation/MainTabs.tsx`)
Added Events tab:
- Trophy icon (outline/filled)
- Positioned between Create and Cart
- Direct access to EventListScreen

#### App.js (`mobile/App.js`)
Added stack screens:
- `EventList` - Events listing
- `EventDetail` - Event details (no header)
- `EventSubmission` - Submission flow (no header)

## Key Features

### Secure File Upload Flow

Both web and mobile use a secure 3-step upload process:

1. **Request Upload URL**
   ```typescript
   POST /events/:id/submissions/upload-request
   Body: { title, description, filename, contentType, fileSize }
   Response: { uploadUrl, submissionId, expiresIn }
   ```

2. **Upload to S3**
   ```typescript
   PUT <uploadUrl>
   Body: <file binary>
   Headers: { 'Content-Type': <contentType> }
   ```

3. **Confirm Submission**
   ```typescript
   POST /events/:id/submissions/:submissionId/confirm
   Response: { submission, message }
   ```

### Mobile-Specific Features

#### Native Image Picker
```typescript
import * as ImagePicker from 'expo-image-picker';

// From gallery
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
});

// From camera
const result = await ImagePicker.launchCameraAsync({
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
});
```

#### Background Upload
The upload process continues even if the user navigates away:
- Progress tracking with percentage
- Visual progress bar
- Overlay prevents navigation during upload
- Error recovery

### Responsive Design

#### Web
- Desktop: 3-column grid for events
- Tablet: 2-column grid
- Mobile: Single column
- Sidebar on desktop, stacked on mobile
- Hover effects on desktop only

#### Mobile
- Native components (SafeAreaView, ScrollView)
- Platform-specific styling
- Touch-optimized buttons
- Pull-to-refresh
- Native navigation

## Styling

### Web
- Tailwind CSS classes
- Framer Motion animations
- Custom color palette (sage, charcoal, cream)
- Responsive breakpoints
- Hover and tap animations

### Mobile
- StyleSheet API
- Consistent spacing (SPACING constants)
- Typography system (TYPOGRAPHY constants)
- Color system (COLORS constants)
- Platform-specific adjustments

## Testing Recommendations

### Web Testing
1. Test event browsing and filtering
2. Verify registration flow
3. Test submission upload with various file sizes
4. Check responsive design on different screen sizes
5. Verify animations and transitions
6. Test error states (network errors, validation)

### Mobile Testing
1. Test on iOS and Android
2. Verify camera and gallery permissions
3. Test image upload with large files
4. Verify background upload behavior
5. Test navigation flow
6. Check pull-to-refresh
7. Test offline behavior

### Integration Testing
1. End-to-end registration and submission flow
2. Verify data consistency between web and mobile
3. Test concurrent submissions
4. Verify file upload security
5. Test deadline enforcement
6. Verify winner badge display

## Future Enhancements

### Planned Features
1. **Public Voting**: Allow users to vote on submissions
2. **Live Judging**: Real-time judge scoring interface
3. **Push Notifications**: Event reminders and result announcements
4. **Social Sharing**: Share submissions on social media
5. **Event Calendar**: Calendar view of upcoming events
6. **Team Submissions**: Support for team-based competitions
7. **Video Submissions**: Support for video artwork
8. **AR Preview**: Preview artwork in AR (mobile)

### Performance Optimizations
1. Image lazy loading
2. Infinite scroll for events list
3. Submission thumbnail generation
4. CDN for cover images
5. Caching strategies

## Deployment Notes

### Environment Variables
Ensure these are set:
- `VITE_API_GATEWAY_URL` (web)
- `EXPO_PUBLIC_API_URL` (mobile)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Database Migration
Run the migration:
```bash
supabase migration up
```

### Mobile Build
```bash
cd mobile
eas build --platform ios
eas build --platform android
```

## Support

For issues or questions:
1. Check the database schema in `supabase/migrations/20251016_003_events_competitions.sql`
2. Review API client implementations
3. Check component documentation
4. Test with mock data first

## Summary

The Events & Competitions feature is now fully implemented for both web and mobile platforms with:
- ✅ Complete UI/UX for browsing events
- ✅ Registration system
- ✅ Secure submission workflow
- ✅ Winner showcase
- ✅ Native mobile features (camera, image picker)
- ✅ Background upload support
- ✅ Responsive design
- ✅ Comprehensive error handling
- ✅ Real-time data integration

The implementation follows best practices for security, user experience, and code organization.

