# Events & Competitions - Quick Start Guide

## Testing the Implementation

### Prerequisites

1. **Database Setup**
   ```bash
   # Run the events migration
   cd supabase
   supabase migration up
   ```

2. **Environment Variables**
   - Web: Check `.env` has `VITE_API_GATEWAY_URL`
   - Mobile: Check `.env` has `EXPO_PUBLIC_API_URL`

### Web Testing

#### 1. Start the Web App
```bash
npm run dev
```

#### 2. Navigate to Events
1. Sign in to your account
2. Click "Events" in the navigation menu
3. You should see the events listing page

#### 3. Test Event Browsing
- Use the search bar to filter events
- Click the filter dropdown to filter by type
- Click on an event card to view details

#### 4. Test Event Registration
1. Click on an event
2. Click "Register Now" button
3. Verify registration success banner appears
4. Check that "Submit Entry" button appears (for competitions)

#### 5. Test Submission Flow
1. From an event detail page (after registration)
2. Click "Submit Entry"
3. **Step 1 - Upload**: Select an image file
4. **Step 2 - Details**: Enter title and description
5. **Step 3 - Confirm**: Verify success message
6. Navigate back to event to see submission in gallery

### Mobile Testing

#### 1. Start the Mobile App
```bash
cd mobile
npm start
# Then press 'i' for iOS or 'a' for Android
```

#### 2. Navigate to Events Tab
1. Sign in to your account
2. Tap the "Events" tab (trophy icon) in the bottom navigation
3. You should see the events list

#### 3. Test Event Browsing
- Pull down to refresh
- Use the search bar
- Tap filter chips to filter by type
- Tap an event card to view details

#### 4. Test Event Registration
1. Tap on an event
2. Scroll to bottom
3. Tap "Register Now" button
4. Verify green registration banner appears
5. Check that "Submit Entry" button appears in footer

#### 5. Test Submission Flow
1. From event detail (after registration)
2. Tap "Submit Entry" button
3. **Step 1 - Upload**: 
   - Tap "Choose from Gallery" or "Take Photo"
   - Grant permissions if prompted
   - Select/capture an image
4. **Step 2 - Details**: 
   - Enter title (required)
   - Enter description (optional)
   - Tap "Submit"
5. **Step 3 - Confirm**: 
   - Verify success screen
   - Tap "Done"

### Creating Test Data

#### Option 1: Using Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Open `events` table
4. Click "Insert row"
5. Fill in:
   ```json
   {
     "title": "Summer Art Competition 2025",
     "description": "Show off your best summer-themed artwork!",
     "event_type": "competition",
     "event_date": "2025-08-15T10:00:00Z",
     "registration_deadline": "2025-08-01T23:59:59Z",
     "entry_fee": 25.00,
     "prize_pool": 5000.00,
     "status": "published",
     "is_approved": true,
     "visibility": "public",
     "cover_image": "https://picsum.photos/800/400",
     "location": "Cape Town, South Africa",
     "capacity": 100,
     "rules_and_guidelines": "1. Original artwork only\n2. Maximum file size: 10MB\n3. Submissions close on event date",
     "prizes": [
       {"place": 1, "amount": 3000, "description": "First Place Winner"},
       {"place": 2, "amount": 1500, "description": "Second Place Winner"},
       {"place": 3, "amount": 500, "description": "Third Place Winner"}
     ]
   }
   ```

#### Option 2: Using SQL

```sql
INSERT INTO events (
  title,
  description,
  event_type,
  event_date,
  registration_deadline,
  entry_fee,
  prize_pool,
  status,
  is_approved,
  visibility,
  cover_image,
  location,
  capacity,
  rules_and_guidelines,
  prizes
) VALUES (
  'Summer Art Competition 2025',
  'Show off your best summer-themed artwork!',
  'competition',
  '2025-08-15 10:00:00+00',
  '2025-08-01 23:59:59+00',
  25.00,
  5000.00,
  'published',
  true,
  'public',
  'https://picsum.photos/800/400',
  'Cape Town, South Africa',
  100,
  '1. Original artwork only
2. Maximum file size: 10MB
3. Submissions close on event date',
  '[
    {"place": 1, "amount": 3000, "description": "First Place Winner"},
    {"place": 2, "amount": 1500, "description": "Second Place Winner"},
    {"place": 3, "amount": 500, "description": "Third Place Winner"}
  ]'::jsonb
);
```

### Testing Checklist

#### Web
- [ ] Events page loads
- [ ] Search works
- [ ] Filters work
- [ ] Event cards display correctly
- [ ] Event detail page loads
- [ ] Registration works
- [ ] Submission form opens
- [ ] File upload works
- [ ] Submission appears in gallery
- [ ] Responsive design works on mobile

#### Mobile
- [ ] Events tab appears
- [ ] Events list loads
- [ ] Pull-to-refresh works
- [ ] Search works
- [ ] Filters work
- [ ] Event detail opens
- [ ] Registration works
- [ ] Camera permission requested
- [ ] Gallery permission requested
- [ ] Image picker works
- [ ] Camera works
- [ ] Upload progress shows
- [ ] Submission completes
- [ ] Navigation works correctly

### Common Issues & Solutions

#### Issue: Events not showing
**Solution**: 
- Check that events have `is_approved = true` and `status = 'published'`
- Verify `event_date` is in the future
- Check Supabase RLS policies

#### Issue: Registration fails
**Solution**:
- Verify user is authenticated
- Check that registration deadline hasn't passed
- Verify RLS policies on `event_registrations` table

#### Issue: Upload fails
**Solution**:
- Check file size (must be < 10MB)
- Verify file type is an image
- Check S3 bucket permissions
- Verify API Gateway URL is correct

#### Issue: Mobile permissions not working
**Solution**:
- Uninstall and reinstall the app
- Check `app.json` for permission configurations
- Verify iOS Info.plist has camera/photo permissions

#### Issue: Images not displaying
**Solution**:
- Check image URLs are accessible
- Verify CORS settings on S3 bucket
- Use placeholder images for testing

### Next Steps

After testing the basic functionality:

1. **Test Edge Cases**
   - Try uploading very large files
   - Test with slow network
   - Test with no network (mobile)
   - Try registering for past events
   - Try submitting after deadline

2. **Test User Flows**
   - Complete registration → submission → view in gallery
   - Register for multiple events
   - Submit multiple entries
   - View other users' submissions

3. **Performance Testing**
   - Load page with many events
   - Upload large images
   - Test on slow devices
   - Test with many submissions

4. **UI/UX Testing**
   - Test on different screen sizes
   - Test dark mode (if implemented)
   - Test accessibility
   - Test animations

### Support

If you encounter issues:

1. Check browser/app console for errors
2. Check Supabase logs
3. Verify API Gateway is running
4. Check network requests in DevTools
5. Review the implementation documentation

### Demo Script

For a quick demo:

1. **Show Events List** (30 seconds)
   - Navigate to events page
   - Show search and filters
   - Highlight different event types

2. **Show Event Details** (1 minute)
   - Click on a competition
   - Show event information
   - Highlight prizes
   - Show registration button

3. **Register for Event** (30 seconds)
   - Click register
   - Show success banner
   - Show submit button appears

4. **Submit Entry** (2 minutes)
   - Click submit entry
   - Upload an image
   - Add title and description
   - Show upload progress
   - Show success confirmation

5. **View Submissions** (30 seconds)
   - Navigate back to event
   - Show submission gallery
   - Highlight winner badges
   - Click to view full size

**Total Demo Time**: ~5 minutes

### Feedback

After testing, consider:
- What worked well?
- What was confusing?
- What features are missing?
- What could be improved?

Document feedback and create issues for improvements.

