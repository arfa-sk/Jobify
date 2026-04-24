# Jobify

An AI-powered job application assistant and management platform, built with **Next.js** and optimized for **Vercel**.

## Project Structure

This project uses a unified Next.js architecture to simplify deployment and development:

- **`src/app/`**: The Core Application. Contains all UI pages (Frontend) and API routes (Backend gateway).
- **`src/server/`**: The Brain. Contains business logic, AI services (Gemini), and database models.
- **`src/components/`**: Reusable UI components with a premium glassmorphic design.
- **`src/lib/`**: Shared utilities and configurations.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env.local` file based on `.env.example` and add your keys:
```bash
GEMINI_API_KEY=your_key_here
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Deployment

Deploy easily on Vercel by connecting your GitHub repository.
