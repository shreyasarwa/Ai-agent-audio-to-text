<div align="center">
  <h1> VoxAI</h1>
  <p><strong>Fast, accurate, AI-powered audio transcription.</strong></p>
  <!-- <p>
    <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status" />
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  </p> -->
</div>

---

## What is VoxAI?

VoxAI is a production-grade, full-stack platform designed to take the friction out of audio transcription. Whether you're uploading existing recordings or capturing audio straight from your browser, VoxAI processes the audio and delivers clean, readable text using state-of-the-art AI models (like Whisper). 

Built with an emphasis on a distraction-free, modern UI and real-time feedback.

**Target users:** Journalists, researchers, students, and content creators who need reliable transcriptions without navigating clunky enterprise tools.

## Features

- **Upload & Record:** Drop your audio files directly into the app, or use your microphone for live recording.
- **Real-Time Progress:** See exactly where your transcription is in the pipeline via WebSocket updates.
- **History & Archiving:** Your past transcriptions are safely stored and easily accessible in your dashboard.
- **Interactive Transcripts:** Click through transcription segments with timestamps.
- **Modern UI:** A clean, card-based interface built with React and custom CSS (no generic templates here).

## Tech Stack

**Frontend**
- React (via Vite)
- Zustand (State Management)
- Lucide React (Icons)
- React Router

**Backend**
- Node.js & Express
- PostgreSQL (Database)
- Prisma (ORM)
- WebSockets (`ws`) for real-time client communication

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [PostgreSQL](https://www.postgresql.org/) installed and running.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/voxai.git
cd voxai
```

### 2. Backend Setup
```bash
cd server
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and OPENAI_API_KEY (or local model config)

# Initialize the database
npx prisma migrate dev --name init

# Start the server (runs on port 3001)
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install

# Start the dev server (runs on port 5173)
npm run dev
```

### 4. Open the App
## Live Demo  
🔗 https://ai-agent-audio-to-text.vercel.app

## Project Structure

```text
voxai/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI elements (Sidebar, etc.)
│   │   ├── hooks/       # Custom React hooks (e.g., useWebSocket)
│   │   ├── store/       # Zustand state management
│   │   └── index.css    # Global styles and design tokens
│   └── package.json
└── server/              # Node.js backend
    ├── prisma/          # Database schema and migrations
    ├── src/
    │   ├── routes/      # API endpoints
    │   ├── services/    # Business logic (Whisper integration)
    │   └── app.js       # Express + WebSocket server entry
    └── package.json
```

## Sneak Peek



<img src="/Users/shreyasarwa/Ai agent audio to tex/Dashboard.png" alt="Dashboard" width="100%" />
<br/>
<!-- <img src="https://via.placeholder.com/800x400?text=Transcription+View+Screenshot" alt="Transcription" width="100%" /> -->

## Roadmap

- [ ] Support for multiple languages and translation
- [ ] Export transcripts as PDF / SRT
- [ ] Speaker diarization (detecting "Speaker 1", "Speaker 2")
- [ ] Cloud storage integration (S3/GCS) for larger files

## Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Author

**[Shreya Sarwa]** 

- GitHub: [@shreyasarwa](https://github.com/shreyasarwa)
