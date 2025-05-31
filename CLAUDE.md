# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese alumni association website for 桜町中学校1976年卒業同窓会 (Sakuramachi Junior High School's 1976 graduating class). The architecture combines static HTML pages for public content with Firebase-powered single-page applications for authenticated member areas.

## Development Commands

### Local Development
```bash
# Start local development server
python3 -m http.server 8000

# Access the site
# Public pages: http://localhost:8000/index.html
# Member area: http://localhost:8000/members.html
# Admin area: http://localhost:8000/admin.html
```

### Firebase Integration
- All Firebase configuration is centralized in `assets/js/firebase-config.js`
- Firebase project: `sakuramachi-1976-alumni`
- Uses CDN imports with Firebase v10.7.1

### Testing Credentials
- Member login: Any registered email with valid password
- Default password reference: `sakura1976` (for testing)
- Quick test page: `members-simple.html` (if available)

## Architecture Overview

### Page Hierarchy
- **Public Access**: `index.html`, `about.html`, `news.html`, `contact.html`
- **Member Area**: `members.html` (Firebase Auth required)
- **Admin Dashboard**: `admin.html` (Admin role required)

### Authentication Flow
1. **Firebase Authentication** with email/password
2. **Role-based access control** via Firestore `users.role` field
3. **Session persistence** across page refreshes
4. **Admin privileges** control access to user management and content moderation

### Single Page Application Structure
Both `members.html` and `admin.html` are SPAs with section-based navigation:

**Member Sections:**
- 出欠確認 (RSVP Management)
- 写真ギャラリー (Photo Gallery) 
- 交流掲示板 (Discussion Board)
- 名簿情報 (Member Directory)
- プロフィール編集 (Profile Management)

**Admin Sections:**
- 統計ダッシュボード (Statistics Dashboard)
- ユーザー管理 (User Management)
- イベント管理 (Event Management)
- お問い合わせ管理 (Contact Management)
- 写真管理 (Photo Management)

### Firestore Data Structure
```
users/          - User profiles and authentication data
events/         - Event information and RSVP tracking
news/           - News articles and announcements
contacts/       - Contact form submissions
photos/         - Gallery photos with event relationships
rsvp/           - Event attendance responses
board_posts/    - Discussion forum posts with topics and likes
```

## Key Technical Patterns

### Real-time Data Updates
- Uses Firestore `onSnapshot()` listeners for live updates
- Handles connection state and error recovery
- Properly cleans up listeners to prevent memory leaks

### Photo Management
- **Firebase Storage integration** for file uploads
- **Base64 fallback system** for CORS issues (current implementation)
- **Image optimization** with responsive display and modal viewing
- **Event-based categorization** with filtering capabilities

### Discussion Board System
- **Thread-based posts** with topic categorization
- **Like functionality** with real-time count updates  
- **Author input** with auto-population from user profiles
- **Topic filtering** (近況報告, 思い出話, 同窓会企画, 質問・相談, その他)

### User Management
- **Admin-controlled user creation** with auto-generated passwords
- **Role-based permissions** (admin vs member)
- **Profile visibility controls** with privacy options
- **Special user exclusions** (e.g., specific users hidden from directory)

### Form Handling
- **Progressive enhancement** with JavaScript validation
- **Japanese text input** optimization
- **File upload** with size and type validation
- **Error messaging** in Japanese with user-friendly feedback

## Development Notes

### Code Organization
- **Vanilla JavaScript** with ES6 modules via CDN
- **Component-based rendering** with pure functions
- **Global window functions** for HTML event handlers
- **Centralized Firebase configuration** for easy environment switching

### UI/UX Considerations
- **Mobile-responsive design** with Japanese typography
- **Accessibility features** with proper ARIA labels
- **Loading states** and error handling for Firebase operations
- **Modal systems** for detailed interactions (photo viewing, forms)

### Security Considerations
- **Input sanitization** with escapeHtml utility function
- **Authentication state validation** before sensitive operations
- **Role-based function access** with server-side validation
- **Privacy controls** for member directory visibility

### Performance Optimizations
- **Pagination** for large data sets (photos, users, posts)
- **Image optimization** with responsive sizing
- **Real-time listener management** to prevent excessive API calls
- **Lazy loading** for non-critical content sections

## Firebase Storage CORS Issue

Currently using Base64 image storage due to CORS restrictions. To restore Firebase Storage:

1. Configure CORS in Google Cloud Console
2. Update upload functions to remove Base64 fallback
3. Test with various image sizes and formats

The Base64 implementation includes size validation (800KB limit) to prevent Firestore document size issues.