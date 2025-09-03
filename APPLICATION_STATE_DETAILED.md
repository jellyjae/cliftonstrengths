# Strengths Onboarding Application - Comprehensive State Documentation

## 📋 Executive Summary

This is a **Strengths-Based Wellbeing Application** built with Next.js 15, React 19, and Supabase. The application helps users identify their top 5 CliftonStrengths and provides personalized daily wellbeing prompts across five life aspects. It's designed as an anti-burnout tool that encourages daily reflection and personal growth.

**Current Status**: Fully functional MVP with offline capabilities, ready for user testing and iteration.

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with modern hooks and patterns
- **Styling**: Tailwind CSS with custom design system
- **Components**: Radix UI primitives + shadcn/ui component library
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Type Safety**: TypeScript with strict configuration

### Backend & Database
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Device-based identification (no traditional login)
- **API**: Next.js Server Actions for data operations
- **Real-time**: Supabase real-time subscriptions (configured but not fully implemented)

### State Management & Offline Support
- **Local State**: React hooks (useState, useEffect, useTransition)
- **Offline Storage**: localStorage with intelligent caching
- **Service Worker**: Basic offline functionality
- **Data Sync**: Automatic sync when online, graceful degradation when offline

## 🎯 Core Features & Implementation

### 1. Onboarding Flow (`/onboarding`)
**Purpose**: Guide users through selecting their top 5 CliftonStrengths

**Implementation**:
- Interactive strength selector with search functionality
- Visual feedback for selections (pills with ranking)
- Validation to ensure exactly 5 strengths are selected
- Dual storage: Database + localStorage backup
- Error handling with graceful fallbacks

**Key Components**:
- `StrengthSelector`: Main selection interface
- `onboarding/page.tsx`: Orchestrates the flow
- `lib/actions/user-actions.ts`: Handles profile creation

### 2. Daily Wellbeing Prompts (`/today`)
**Purpose**: Present 5 personalized prompts each day across different life aspects

**Implementation**:
- **Aspects**: Career, Social, Financial, Physical, Community
- **Personalization**: Prompts tailored to user's selected strengths
- **Rotation Algorithm**: Daily rotation through user's 5 strengths
- **Completion Tracking**: Mark prompts as completed with visual feedback
- **Offline Support**: Works without internet connection
- **Confetti Celebration**: Animated celebration when all prompts completed

**Key Components**:
- `today/page.tsx`: Main daily prompts interface
- `lib/daily-selection.ts`: Prompt generation algorithm
- `lib/actions/completion-actions.ts`: Completion tracking
- `components/confetti-celebration.tsx`: Celebration animation

### 3. Progress Dashboard (`/stats`)
**Purpose**: Visualize user's wellbeing journey and progress over time

**Implementation**:
- **Time Ranges**: 7, 30, 90 days filtering
- **Metrics**: Current streak, longest streak, completion rate
- **Charts**: Bar charts for completions by aspect and strength
- **Real-time Updates**: Reflects latest completion data

**Key Components**:
- `stats/page.tsx`: Statistics dashboard
- `lib/actions/stats-actions.ts`: Data aggregation
- Recharts integration for visualizations

### 4. Settings & Management (`/settings`)
**Purpose**: Allow users to modify their experience and manage data

**Implementation**:
- **Strength Editing**: Modify selected strengths with confirmation
- **Data Reset**: Complete data wipe with safety confirmation
- **Profile Management**: Update user preferences

**Key Components**:
- `settings/page.tsx`: Settings interface
- `lib/actions/settings-actions.ts`: Settings operations
- `components/confirm-dialog.tsx`: Safety confirmations

### 5. Home Dashboard (`/`)
**Purpose**: Central hub with quick access to all features

**Implementation**:
- **Welcome Screen**: Personalized greeting with user's strengths
- **Quick Actions**: Direct links to today's prompts, stats, settings
- **Strength Display**: Visual representation of user's top 5 strengths
- **Offline Status**: Connection status indicator

## 🗄️ Database Schema

### Core Tables

#### `themes` - CliftonStrengths Definitions
```sql
- id: UUID (Primary Key)
- name: TEXT (Unique) - e.g., "Achiever", "Learner"
- description: TEXT - Full CliftonStrengths description
- created_at: TIMESTAMP
```

#### `profile` - User Profiles
```sql
- id: UUID (Primary Key)
- device_id: TEXT (Unique) - Device-based identification
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `user_strengths` - User's Top 5 Strengths
```sql
- id: UUID (Primary Key)
- profile_id: UUID (Foreign Key → profile.id)
- theme_id: UUID (Foreign Key → themes.id)
- rank: INTEGER (1-5) - Ranking of strength
- created_at: TIMESTAMP
- UNIQUE(profile_id, theme_id)
- UNIQUE(profile_id, rank)
```

#### `prompts` - Wellbeing Prompts Library
```sql
- id: UUID (Primary Key)
- theme_id: UUID (Foreign Key → themes.id)
- aspect: ENUM (career, social, financial, physical, community)
- prompt_text: TEXT - The actual prompt
- tags: TEXT[] - Optional categorization
- created_at: TIMESTAMP
- UNIQUE(theme_id, aspect, prompt_text)
```

#### `daily_prompts` - Daily Prompt Assignments
```sql
- id: UUID (Primary Key)
- device_id: TEXT - User identifier
- for_date: DATE - Date for which prompts are assigned
- aspect: ENUM - Which wellbeing aspect
- theme_id: UUID (Foreign Key → themes.id)
- prompt_id: UUID (Foreign Key → prompts.id)
- created_at: TIMESTAMP
- UNIQUE(device_id, for_date, aspect)
```

#### `completions` - Prompt Completion Tracking
```sql
- id: UUID (Primary Key)
- device_id: TEXT - User identifier
- for_date: DATE - Date of completion
- prompt_id: UUID (Foreign Key → prompts.id)
- aspect: ENUM - Wellbeing aspect
- completed_at: TIMESTAMP
- UNIQUE(device_id, for_date, prompt_id)
```

### Database Features
- **Row Level Security (RLS)**: Enabled on all tables
- **Open Policies**: Currently configured for single-user demo
- **Indexes**: Optimized for common query patterns
- **Constraints**: Data integrity through foreign keys and unique constraints

## 🔧 Key Algorithms & Logic

### Daily Prompt Generation Algorithm
**Location**: `lib/daily-selection.ts`

**Process**:
1. **Day Index Calculation**: `Math.floor(new Date(targetDate).getTime() / (1000 * 60 * 60 * 24))`
2. **Strength Rotation**: `(dayIndex + aspectIndex) % 5` - Rotates through user's 5 strengths
3. **Exclusion Logic**: Avoids prompts used in last 14 days
4. **Fallback System**: Multiple levels of fallback if no prompts available
5. **Aspect Coverage**: Ensures one prompt per wellbeing aspect

**Example**:
- Day 0: Career→Strength1, Social→Strength2, Financial→Strength3, Physical→Strength4, Community→Strength5
- Day 1: Career→Strength2, Social→Strength3, Financial→Strength4, Physical→Strength5, Community→Strength1

### Offline Caching Strategy
**Location**: `lib/offline-cache.ts`

**Features**:
- **Daily Cache**: Stores prompts and completions for current day
- **Automatic Expiry**: Cache invalidates at midnight
- **Sync on Reconnect**: Automatically syncs when back online
- **Graceful Degradation**: App works fully offline

### Device Identification
**Location**: `lib/device-id.ts`

**Implementation**:
- **UUID Generation**: Uses `crypto.randomUUID()`
- **Persistent Storage**: Stored in localStorage
- **Cross-session**: Maintains identity across browser sessions
- **No Authentication**: No passwords or login required

## 📱 User Experience Flow

### First-Time User Journey
1. **Landing** → Redirected to `/onboarding`
2. **Strength Selection** → Choose 5 CliftonStrengths with search
3. **Confirmation** → Review selections and complete
4. **Profile Creation** → Data saved to database + localStorage
5. **Redirect** → Taken to home dashboard

### Daily User Journey
1. **Home Dashboard** → See today's progress and quick actions
2. **Today's Prompts** → Complete 5 personalized prompts
3. **Progress Tracking** → Visual feedback and completion status
4. **Celebration** → Confetti animation when all completed
5. **Stats Review** → Check progress and streaks

### Settings & Management
1. **Access Settings** → From home dashboard or navigation
2. **Edit Strengths** → Modify top 5 with confirmation
3. **Data Reset** → Complete wipe with safety confirmation
4. **Return to Onboarding** → Start fresh if desired

## 🎨 Design System & UI

### Color Palette
- **Primary**: Blue tones for main actions and highlights
- **Secondary**: Green for secondary actions and success states
- **Accent**: Purple for special highlights and accents
- **Semantic**: Red for errors, yellow for warnings, green for success

### Component Architecture
- **Base Components**: Built on Radix UI primitives
- **Design System**: Consistent spacing, typography, and interactions
- **Responsive**: Mobile-first design with adaptive layouts
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Visual Feedback
- **Loading States**: Skeleton loaders and spinners
- **Error States**: Clear error messages with retry options
- **Success States**: Confetti animations and completion indicators
- **Offline States**: Clear indicators when offline

## 🚀 Current Implementation Status

### ✅ Completed Features
- **Complete Onboarding Flow**: Strength selection with validation
- **Daily Prompt System**: Personalized prompts with rotation algorithm
- **Progress Tracking**: Completion tracking with visual feedback
- **Statistics Dashboard**: Comprehensive analytics with charts
- **Settings Management**: Strength editing and data reset
- **Offline Functionality**: Full offline support with caching
- **Responsive Design**: Works on all device sizes
- **Database Schema**: Complete schema with relationships
- **Error Handling**: Graceful error handling throughout
- **Type Safety**: Full TypeScript implementation

### 🔄 Partially Implemented
- **Real-time Sync**: Supabase real-time configured but not fully utilized
- **Advanced Analytics**: Basic stats implemented, advanced analytics planned
- **Service Worker**: Basic setup, could be enhanced for better offline experience

### 📋 Planned Features
- **Social Features**: Sharing capabilities and community features
- **Advanced Analytics**: More detailed insights and trends
- **Custom Prompts**: User-generated prompt creation
- **Multi-device Sync**: Cross-device synchronization
- **Export/Import**: Data portability features
- **Notifications**: Daily reminders and streak notifications

## 🛠️ Development & Deployment

### Environment Setup
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Run SQL scripts in `scripts/` directory in order
2. Import CSV data for prompts (if available)
3. Configure RLS policies for production
4. Test database connections

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Deployment
- **Platform**: Vercel (configured)
- **Database**: Supabase (configured)
- **CI/CD**: Automatic deployment from main branch
- **Environment**: Separate configs for dev/staging/prod

## 🔍 Code Quality & Architecture

### Code Organization
```
app/                    # Next.js App Router pages
├── onboarding/        # Onboarding flow
├── today/            # Daily prompts
├── stats/            # Statistics dashboard
├── settings/         # Settings and management
└── api/              # API routes

components/            # Reusable UI components
├── ui/               # Base UI components (shadcn/ui)
├── strength-selector.tsx
├── daily-prompts.tsx
└── ...

lib/                   # Utility libraries and business logic
├── actions/          # Server actions
├── supabase/         # Database client configuration
├── device-id.ts      # Device identification
├── offline-cache.ts  # Offline caching
└── daily-selection.ts # Prompt generation algorithm
```

### Type Safety
- **Strict TypeScript**: All code is fully typed
- **Interface Definitions**: Clear interfaces in `lib/types.ts`
- **Runtime Validation**: Zod schemas for API validation
- **Error Handling**: Typed error responses

### Performance Optimizations
- **Server Actions**: Efficient API calls without client-side JavaScript
- **Optimistic Updates**: Immediate UI feedback
- **Lazy Loading**: Components load as needed
- **Caching**: Multiple layers of data caching
- **Bundle Optimization**: Tree shaking and code splitting

## 🚨 Known Issues & Technical Debt

### Current Limitations
- **Single Device**: No multi-device synchronization
- **Basic Offline**: Could be enhanced with more sophisticated caching
- **Limited Prompt Variety**: Depends on database content
- **No User Accounts**: Device-based identification only

### Technical Debt
- **Error Handling**: Could be more comprehensive in some areas
- **Testing**: No automated tests currently implemented
- **Performance Monitoring**: No performance tracking implemented
- **Code Duplication**: Some logic could be better abstracted

### Security Considerations
- **RLS Policies**: Currently open for demo, needs production hardening
- **Data Privacy**: Device-based identification is privacy-friendly
- **Input Validation**: Basic validation, could be enhanced

## 🔮 Future Roadmap

### Short Term (1-2 months)
- **Enhanced Offline Experience**: Better caching and sync
- **Improved Error Handling**: More robust error recovery
- **Performance Optimizations**: Bundle size and loading improvements
- **User Testing**: Gather feedback and iterate

### Medium Term (3-6 months)
- **Multi-device Support**: Cross-device synchronization
- **Advanced Analytics**: More detailed insights and trends
- **Social Features**: Sharing and community features
- **Mobile App**: React Native or PWA enhancement

### Long Term (6+ months)
- **AI Integration**: AI-powered prompt generation
- **Community Platform**: User-generated content and sharing
- **Enterprise Features**: Team and organization support
- **Integration Ecosystem**: Connect with other wellbeing tools

## 📊 Data Flow & Architecture

### User Data Flow
```
User Interaction → React Component → Server Action → Supabase → Database
                ↓
            localStorage (Backup) ← Offline Cache ← Response
```

### Offline Strategy
```
Online: Real-time sync with database
Offline: Local storage + cached data
Reconnection: Automatic sync when online
```

### Prompt Generation Flow
```
Daily Request → Check Existing → Generate New → Rotate Strengths → Select Prompts → Store & Return
```

## 🎯 Success Metrics & KPIs

### User Engagement
- **Daily Active Users**: Users completing prompts daily
- **Completion Rate**: Percentage of prompts completed
- **Streak Length**: Average and maximum streak lengths
- **Retention**: Users returning after first week

### Technical Performance
- **Load Time**: Page load and prompt generation speed
- **Offline Usage**: Percentage of offline interactions
- **Error Rate**: Application error frequency
- **Database Performance**: Query response times

### Wellbeing Impact
- **User Feedback**: Qualitative feedback on wellbeing impact
- **Usage Patterns**: Which aspects users engage with most
- **Strength Engagement**: How different strengths are utilized
- **Long-term Retention**: Sustained usage over months

---

## 📝 Development Notes

### Recent Changes
- Implemented comprehensive offline support
- Added confetti celebration for completion
- Enhanced error handling and fallback systems
- Improved prompt generation algorithm
- Added comprehensive statistics dashboard

### Next Priorities
1. User testing and feedback collection
2. Performance optimization
3. Enhanced offline experience
4. Advanced analytics features
5. Social sharing capabilities

### Code Quality Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Component Structure**: Reusable and maintainable
- **Error Boundaries**: Graceful error handling

---

*This document reflects the current state as of the last update. For the most recent information, check the codebase and recent commits.*

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready MVP
