# Personalized Mental Health Assistant

A web application designed to help users track their mental health through mood logging and AI-powered chatbot conversations. This project provides a personalized mental health assistant with user authentication, mood tracking features, and an intelligent chatbot using advanced AI models.

## Features

- **User Authentication**: Secure registration and login system with JWT tokens
- **Mood Tracking**: Log daily moods with predefined labels (very sad, sad, neutral, happy, very happy) and optional reasons
- **Dashboard**: Visualize mood trends over time with interactive charts
- **AI Chatbot**: Engage in conversations with an AI assistant powered by LangChain and OpenAI/Google Gemini models
- **Conversation Summaries**: Automatic summarization of user-chatbot interactions for personalized insights

## Tech Stack

### Frontend
- **React**: UI library for building the user interface
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **Recharts**: Chart library for mood visualization

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for API development
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **LangChain**: Framework for building AI applications
- **OpenAI API**: GPT models for chatbot functionality
- **Google Gemini API**: Alternative AI model support

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)
- API keys for OpenAI and/or Google Gemini

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/personalized-mental-health-assistant.git
   cd personalized-mental-health-assistant
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

## Usage

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:5173`
   - Register a new account or login with existing credentials
   - Start tracking your mood and chatting with the AI assistant

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Mood Tracking
- `POST /api/mood` - Create a new mood entry
- `GET /api/mood` - Get user's mood entries
- `PUT /api/mood/:id` - Update a mood entry
- `DELETE /api/mood/:id` - Delete a mood entry

### Chatbot
- `POST /api/chatbot/chat` - Send a message to the chatbot
- `GET /api/chatbot/summary` - Get conversation summary

