/**
 * Sanora — Frontend Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to your Supabase project dashboard
 * 2. Navigate to: Settings → API
 * 3. Copy "Project URL"          → paste into SUPABASE_URL
 * 4. Copy "anon / public" key    → paste into SUPABASE_ANON_KEY
 * 5. After deploying the backend, update BACKEND_URL with your Railway/Render URL
 */

// eslint-disable-next-line no-unused-vars
const SUPABASE_URL = 'https://eaadcihxqkdctvhrhybn.supabase.co';           // e.g. https://abcxyz.supabase.co

// eslint-disable-next-line no-unused-vars
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhYWRjaWh4cWtkY3R2aHJoeWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NzkyNTMsImV4cCI6MjEwNjM1NTI1M30.VfbRvkp1fC4U9Op-OJ2lCKrk4Gn65nwGwpi8kAPhyLM'; // "anon" public key from Settings → API

// Determine if the frontend is running locally
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// eslint-disable-next-line no-unused-vars
const BACKEND_URL = isLocal 
  ? 'http://localhost:8000' 
  : 'https://sanora-backend.onrender.com'; // Update this to your actual Render URL after deploying the backend!
