# Sanora 👗✨

> **Less time deciding what to wear, and better use of the clothes you already own.**

Sanora is a full-stack digital wardrobe and personalized outfit recommendation engine. It turns your physical closet into a smart, interactive system that helps you effortlessly build outfits from the clothes you already own.

---

## 💡 The Problem

Many of us have wardrobes full of clothes, yet still struggle with the daily question: *"What should I wear today?"*

Choosing an outfit can consume unnecessary time. It requires trying to remember what you own, figuring out what fits a specific occasion, and mentally matching tops, bottoms, and accessories. As a result, people often repeatedly wear the same few combinations or feel like they have "nothing to wear" despite having plenty of clothes.

## 🎯 The Solution

Sanora is built to eliminate outfit fatigue. Instead of manually digging through your closet, you simply log your clothes into Sanora. 

When you need an outfit, you select the style or occasion (e.g., Traditional, Casual, Party, or just "Surprise Me"), and Sanora's **rule-based matching engine** will instantly construct a valid, coordinated outfit combination exclusively using the clothes in your digital closet.

---

## ✨ Key Features

- **🔐 User Authentication**: Secure email and Google OAuth sign-in powered by Supabase.
- **📱 Digital Closet**: Upload images of your clothing, categorize them (Top, Bottom, Dupatta, Footwear, etc.), and tag them with colors, seasons, and occasions.
- **🎯 Style-Based Recommendations**: Choose a vibe (Traditional, Casual, Indo-Western, etc.) and get an instant outfit tailored to that aesthetic.
- **🎲 Surprise Me**: Feeling adventurous? Get a completely random, yet valid, outfit combination from your wardrobe.
- **🪄 Build an Outfit Around This**: Have a favorite pair of jeans you *really* want to wear? Lock it in, and Sanora will automatically build the rest of the outfit around it.
- **🔒 Individual Item Control (Keep/Change)**: Love the top but hate the pants? Keep the top locked in place and instantly cycle through different bottoms until you find the perfect match.
- **🔄 "Do Not Repeat" Logic**: Sanora automatically tracks your 7-day outfit history to ensure it doesn't suggest the *exact same* outfit combination you wore earlier in the week.
- **📖 Outfit History**: Save your final outfits to your history log so you can look back at what you wore (and delete old entries).

---

## 🛠️ Tech Stack

Sanora uses a modern, lightweight, and scalable technology stack:

### Frontend
- **HTML5 & CSS3**: Pure, semantic HTML with a beautifully crafted, responsive vanilla CSS design system (custom variables, modern gradients, glassmorphism).
- **Vanilla JavaScript**: Zero-dependency frontend logic using native ES6 modules and async/await.
- **Supabase JS SDK**: For client-side authentication and file uploads.

### Backend
- **Python 3.12**: Fast, modern Python backend.
- **FastAPI**: High-performance async API framework for handling frontend requests and routing.
- **Supabase-py v2**: Server-side communication with the database.
- **Pydantic**: Data validation and strict typing for API requests and responses.

### Database & Storage (Supabase)
- **PostgreSQL**: Relational database storing users, clothing items, and outfit history.
- **Supabase Storage**: Secure cloud storage bucket for uploaded clothing images.

---

## 🏗️ System Architecture & Rule Engine

Sanora does **not** rely on external AI, ML, or LLM APIs to match clothes. Instead, it uses a deterministic, locally-hosted **Rule Engine** (`rule_engine.py`).

1. **Filtering**: When a request is made, the engine filters the user's wardrobe based on the requested style, occasion, and season.
2. **Locking**: It respects user-selected "locked" items, ensuring those specific pieces are forced into the final combination.
3. **Assembly**: It uses combinatorics to pair items logically (e.g., `Top + Bottom` or `Full-Outfit + Footwear`).
4. **History Checking**: Before returning an outfit, it hashes the combination and checks it against the user's recent 7-day history to avoid repeating outfits.

---

## 📂 Project Structure

```text
sanora/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT & Supabase auth verification
│   │   ├── routers/        # FastAPI route handlers (wardrobe, outfits, history)
│   │   ├── schemas/        # Pydantic data models
│   │   ├── services/       # Core business logic (Rule Engine, recommendations)
│   │   └── main.py         # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── js/                 # Vanilla JS logic (api, auth, closet, outfit, style, etc.)
│   ├── index.html          # Landing / Login page
│   ├── style.html          # Style / Occasion selection
│   ├── closet.html         # Digital wardrobe management
│   ├── outfit.html         # Outfit recommendation interface
│   ├── history.html        # Outfit history log
│   └── style.css           # Global design system
└── supabase/
    └── migrations/         # PostgreSQL database schemas
```

---

## 🚀 Setup and Installation

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com).
2. Navigate to the SQL Editor and run all the SQL files located in `supabase/migrations/` in order.
3. Create a public storage bucket named `clothing-images`.
4. From your Supabase Project Settings, copy your **Project URL**, **Anon Public Key**, and **Service Role Key**.

### 2. Backend Setup
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```
Edit the `.env` file and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
FRONTEND_URL=http://127.0.0.1:5500
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```
The backend will run on `http://127.0.0.1:8000`.

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```
Edit `js/config.js` and add your Supabase URL and Anon Key:
```javascript
const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
const BACKEND_URL = 'http://127.0.0.1:8000';
```
Serve the frontend using any local web server. For example:
```bash
npx serve .
# or
python -m http.server 5500
```
Open your browser to `http://127.0.0.1:5500` to start using Sanora!

---

*Designed and built to solve the "nothing to wear" dilemma.* 👗✨
