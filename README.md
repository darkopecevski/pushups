# Pushups Challenge App

A fitness tracking application built with Astro.js and Supabase to help users track their daily exercise challenges and compete with friends.

## Features

- 🔐 Secure authentication with Supabase Auth
- 👤 User profiles with customizable information
- 💪 Create and join exercise challenges
- 📊 Track daily exercise counts
- 🏆 Leaderboards for motivation
- 📱 Responsive design for all devices

## Project Structure

- `/src/components/` - React components for interactive UI
- `/src/layouts/` - Reusable page layouts
- `/src/lib/` - Utility functions and Supabase client
- `/src/pages/` - Astro pages that define the application routes

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/pushups-app.git
   cd pushups-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a Supabase project at https://supabase.com

4. Copy `.env.example` to `.env` and update with your Supabase credentials
   ```
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Run the database setup SQL from `supabase-schema.sql` in the Supabase SQL Editor

6. Start the development server
   ```
   npm run dev
   ```

7. Visit `http://localhost:4321` in your browser

## Deployment

This application can be deployed to any platform that supports Node.js applications, such as Vercel, Netlify, or a traditional hosting provider.

```
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.