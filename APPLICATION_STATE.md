# Strengths Onboarding Application - Current State Documentation

## Overview
This is a **Strengths-Based Wellbeing Application** built with Next.js 15, React 19, and Supabase. The app helps users identify their top 5 CliftonStrengths and provides personalized daily wellbeing prompts across five life aspects.

## 🏗️ Architecture & Tech Stack

### Frontend Framework
- **Next.js 15** with App Router
- **React 19** with modern hooks and patterns
- **TypeScript** for type safety
- **Tailwind CSS** for styling with custom design system

### UI Components
- **Radix UI** primitives for accessible components
- **shadcn/ui** component library
- **Lucide React** for icons
- **Custom UI components** built on top of the design system

### Backend & Database
- **Supabase** for database and authentication
- **PostgreSQL** database with Row Level Security (RLS)
- **Server Actions** for API endpoints
- **Edge Functions** ready

### State Management
- **React hooks** (useState, useEffect, useTransition)
- **Local storage** for offline functionality
- **Supabase real-time** subscriptions (configured but not fully implemented)

## 🎯 Core Features

### 1. Onboarding Flow
- **Strength Selection**: Users select their top 5 CliftonStrengths from 34 available themes
- **Device-based identification**: Uses device ID for user identification
- **Local storage fallback**: Works offline with localStorage backup
- **Progressive selection**: Visual feedback and validation

### 2. Daily Wellbeing Prompts
- **5 daily prompts** across different life aspects:
  - Career
  - Social
  - Financial
  - Physical
  - Community
- **Strength-based personalization**: Prompts tailored to user's selected strengths
- **Daily rotation**: New prompts each day
- **Completion tracking**: Mark prompts as completed

### 3. Progress Dashboard
- **Completion statistics** by aspect and strength
- **Streak tracking** (current and longest streaks)
- **Time-based filtering** (7, 30, 90 days)
- **Visual charts** using Recharts library

### 4. Settings & Management
- **Strength editing**: Modify selected strengths
- **Data reset**: Clear all user data
- **Theme switching**: Light/dark mode support

## 🗄️ Database Schema

### Core Tables
1. **`themes`** - 34 CliftonStrengths with descriptions
2. **`profile`** - User profiles linked by device_id
3. **`user_strengths`** - User's top 5 strengths with rankings
4. **`prompts`** - Wellbeing prompts by strength and aspect
5. **`daily_prompts`** - Daily prompt assignments
6. **`completions`** - User prompt completion tracking

### Key Relationships
- Each user has exactly 5 strengths (ranked 1-5)
- Prompts are categorized by strength theme and wellbeing aspect
- Daily prompts are generated based on user's strengths
- Completions track user engagement over time

## 🔧 Implementation Details

### Authentication & User Management
- **Device-based identification**: No traditional login required
- **Local storage persistence**: Works offline
- **Supabase integration**: Ready for user accounts if needed

### Offline Functionality
- **Service Worker**: Basic offline caching setup
- **Local storage fallback**: Critical data cached locally
- **Offline detection**: Graceful degradation when offline

### Performance Features
- **Server Actions**: Efficient API calls
- **Optimistic updates**: Immediate UI feedback
- **Lazy loading**: Components load as needed
- **Caching strategies**: Multiple layers of data caching

## 📱 User Experience

### Onboarding Journey
1. **Welcome screen** with app introduction
2. **Strength selection** with search and filtering
3. **Confirmation** of selected strengths
4. **Redirect to main dashboard**

### Daily Workflow
1. **Home dashboard** showing strengths and quick actions
2. **Today's prompts** with completion tracking
3. **Progress visualization** in stats dashboard
4. **Settings access** for customization

### Responsive Design
- **Mobile-first approach**
- **Touch-friendly interactions**
- **Adaptive layouts** for different screen sizes
- **Progressive Web App** features

## 🚀 Current Implementation Status

### ✅ Completed Features
- Complete onboarding flow
- Daily prompt generation and display
- Strength-based personalization
- Progress tracking and statistics
- Offline functionality
- Responsive UI design
- Database schema and setup
- Basic service worker

### 🔄 In Progress
- Enhanced offline caching
- Real-time data synchronization
- Advanced analytics
- User preferences

### 📋 Planned Features
- Social sharing capabilities
- Advanced streak analytics
- Custom prompt creation
- Multi-device synchronization
- Export/import functionality

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- pnpm package manager
- Supabase project with database access

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Run SQL scripts in `scripts/` directory in order
2. Import CSV data for prompts
3. Configure RLS policies
4. Test database connections

## 📊 Data Flow

### User Journey
```
Onboarding → Strength Selection → Daily Prompts → Completion Tracking → Progress Analytics
```

### Data Synchronization
```
Local Storage ↔ Supabase Database ↔ UI Components
```

### Offline Strategy
```
Online: Real-time sync with database
Offline: Local storage + cached data
Reconnection: Automatic sync when online
```

## 🔍 Key Components

### Core Components
- **`StrengthSelector`**: Interactive strength selection interface
- **`DailyPrompts`**: Daily prompt display and completion
- **`StreakBanner`**: Motivation and progress display
- **`OfflineStatus`**: Connection status indicator

### Utility Libraries
- **`device-id.ts`**: Device identification management
- **`offline-cache.ts`**: Offline data caching
- **`day-boundary.ts`**: Daily reset logic
- **`daily-selection.ts`**: Prompt selection algorithms

## 🎨 Design System

### Color Palette
- **Primary**: Blue tones for main actions
- **Secondary**: Green for secondary actions
- **Accent**: Purple for highlights
- **Semantic**: Success, warning, error states

### Typography
- **Headings**: Clear hierarchy with proper contrast
- **Body text**: Readable and accessible
- **Interactive elements**: Clear call-to-action styling

### Component Patterns
- **Cards**: Information grouping and organization
- **Buttons**: Consistent interaction patterns
- **Forms**: Accessible input handling
- **Navigation**: Intuitive wayfinding

## 🚨 Known Issues & Limitations

### Current Limitations
- Single device per user (no multi-device sync)
- Basic offline functionality
- Limited prompt variety
- No user account system

### Technical Debt
- Some components could be optimized
- Error handling could be more robust
- Testing coverage needs improvement
- Performance monitoring not implemented

## 🔮 Future Roadmap

### Short Term (1-2 months)
- Enhanced offline experience
- Better error handling
- Performance optimizations
- User testing and feedback

### Medium Term (3-6 months)
- Multi-device support
- Advanced analytics
- Social features
- Mobile app development

### Long Term (6+ months)
- AI-powered prompt generation
- Community features
- Integration with other wellbeing tools
- Enterprise features

## 📝 Development Notes

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Component structure**: Reusable and maintainable

### Testing Strategy
- **Manual testing**: Core user flows
- **Component testing**: Individual component validation
- **Integration testing**: End-to-end workflows
- **Performance testing**: Load and stress testing

### Deployment
- **Vercel**: Production hosting
- **Environment management**: Separate configs for dev/staging/prod
- **CI/CD**: Automated deployment pipeline
- **Monitoring**: Basic error tracking

---

*This document reflects the current state as of the last update. For the most recent information, check the codebase and recent commits.*
