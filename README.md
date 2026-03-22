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

4. **Environment Configuration:**

   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/mental-health-app
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_API_KEY=your-google-gemini-api-key
   PORT=5000
   ```

   - Replace `your-super-secret-jwt-key` with a strong secret key
   - Get API keys from [OpenAI](https://platform.openai.com/api-keys) and [Google AI Studio](https://makersuite.google.com/app/apikey)

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

## Project Structure

```
personalized-mental-health-assistant/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── MoodEntry.js
│   │   │   └── ConversationSummary.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── mood.js
│   │       └── chatbot.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ui.jsx
│   │   ├── lib/
│   │   │   └── api.js
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── MoodTracker.jsx
│   │       └── Chatbot.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application is not a substitute for professional mental health care. If you're experiencing mental health concerns, please consult with qualified healthcare professionals.</content>
<parameter name="filePath">d:\PROJECt\PORJ\Mini project mental\Mini project mental\Mini project mental\README.md
