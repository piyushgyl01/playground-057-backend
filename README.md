# AI-Powered Job Match Platform

A full-stack application that uses AI to match users with relevant job opportunities based on their skills, experience, and preferences.

## Features

- **User Authentication**: Secure sign up and login functionality with JWT
- **User Profile Management**: Create and edit your profile with skills, experience, and job preferences
- **Job Listings**: Browse available job opportunities with search and filtering capabilities
- **AI-Powered Job Recommendations**: Get personalized job matches powered by Cohere's AI API
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend

- **React**: Built with React 19 for a modern, responsive UI
- **Vite**: Fast build tooling for improved development experience
- **Bootstrap**: Styling and UI components with Bootstrap 5
- **React Router**: Navigation and routing (v7)
- **Axios**: HTTP client for API communication

### Backend

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework for Node.js
- **MongoDB**: NoSQL database for storing user and job data
- **Mongoose**: MongoDB object modeling tool
- **JWT**: JSON Web Tokens for authentication
- **Cohere API**: AI model for job recommendations

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cohere API key (free tier available)

### Backend Setup

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/job-match-platform.git
   cd job-match-platform
   ```

2. Install backend dependencies

   ```bash
   cd server
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:

   ```
   PORT=3002
   MONGODB_URI=mongodb://localhost:27017/job-match-platform
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   COHERE_API_KEY=your_cohere_api_key_here
   ```

4. Start the backend server
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Open a new terminal window/tab

2. Install frontend dependencies

   ```bash
   cd client
   npm install
   ```

3. Create a `.env` file in the client directory with the following variables:

   ```
   VITE_API_URL=http://localhost:3002/api
   ```

4. Start the frontend development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the URL provided by Vite (typically http://localhost:5173)

### Seeding Jobs Data

To seed the database with sample job listings, make a POST request to:

```
POST http://localhost:3002/api/jobs/seed
```

You can do this using Postman or any API testing tool, or by visiting the jobs page in the application which will automatically seed jobs if none exist.

## API Documentation

### Authentication Endpoints

- **Register User**

  - `POST /api/auth/register`
  - Body: `{ email, password }`
  - Response: JWT token

- **Login User**

  - `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: JWT token

- **Get Current User**
  - `GET /api/auth/me`
  - Headers: `x-auth-token: token`
  - Response: User data (without password)

### Profile Endpoints

- **Get Current User Profile**

  - `GET /api/profile/me`
  - Headers: `x-auth-token: token`
  - Response: User profile data

- **Create or Update Profile**

  - `POST /api/profile`
  - Headers: `x-auth-token: token`
  - Body: `{ name, location, yearsOfExperience, skills, preferredJobType }`
  - Response: Profile data

- **Delete Profile**
  - `DELETE /api/profile`
  - Headers: `x-auth-token: token`
  - Response: Success message

### Job Endpoints

- **Get All Jobs**

  - `GET /api/jobs`
  - Response: Array of job listings

- **Get Job by ID**

  - `GET /api/jobs/:id`
  - Response: Job details

- **Create Job**

  - `POST /api/jobs`
  - Headers: `x-auth-token: token`
  - Body: `{ title, company, location, description, skills, jobType, salary }`
  - Response: Job data

- **Update Job**

  - `PUT /api/jobs/:id`
  - Headers: `x-auth-token: token`
  - Body: `{ title, company, location, description, skills, jobType, salary }`
  - Response: Updated job data

- **Delete Job**

  - `DELETE /api/jobs/:id`
  - Headers: `x-auth-token: token`
  - Response: Success message

- **Seed Jobs**
  - `POST /api/jobs/seed`
  - Response: Success message with count of seeded jobs

### Recommendation Endpoints

- **Get Job Recommendations**
  - `GET /api/recommendations`
  - Headers: `x-auth-token: token`
  - Response: Array of recommended jobs with match scores and reasons

## AI Integration and Prompt Design

The job recommendation system uses the Cohere API to analyze the user's profile and match it with available job listings. Here's how it works:

1. **Data Collection**: When a user clicks "Find My Matches", the system collects:

   - User profile data (skills, experience, location, job preferences)
   - Available job listings

2. **AI Prompt Construction**: The system constructs a prompt for the AI that includes:

   - A clear task description for the AI
   - Structured user profile data
   - Structured job listings data
   - A specific request for the output format (JSON with job IDs, match scores, and match reasons)

3. **Cohere API Call**: The backend sends this prompt to the Cohere API using the 'command' model, which is a powerful text generation model that can understand and follow complex instructions.

4. **Response Processing**: The AI returns a text response with job recommendations, which is then:

   - Parsed to extract the JSON format with matched jobs
   - Enriched with the full job details from the database
   - Returned to the frontend for display

5. **Fallback Mechanism**: If the AI response parsing fails, a built-in algorithm matches jobs based on skills and job type preferences to ensure users always get recommendations.

### Prompt Design

The prompt is designed to:

- Give the AI a clear role and task
- Provide structured data in a way the AI can analyze
- Request specific output format for easy parsing
- Set parameters to control the AI's creativity and focus

```javascript
const prompt = `You are an AI job matcher. Find the top 3 job matches for this candidate based on their profile and the available job listings.
                
Candidate Profile:
- Name: ${profile.name}
- Location: ${profile.location}
- Years of Experience: ${profile.yearsOfExperience}
- Skills: ${profile.skills.join(", ")}
- Preferred Job Type: ${profile.preferredJobType}

Available Jobs:
${JSON.stringify(jobsData)}

Return ONLY a JSON array of the top 3 job matches with this format:
[
  {
    "id": "job_id",
    "title": "job_title",
    "company": "company_name",
    "matchScore": 85,
    "matchReasons": ["reason1", "reason2", "reason3"]
  },
  ...
]

The matchScore should be between 0-100 and represent how well the candidate matches the job requirements.
The matchReasons should include 2-3 specific reasons why this job is a good match for the candidate.
Return ONLY the JSON array with no additional text.`;
```

### Cohere Integration

The implementation uses Cohere's API, which provides:

1. Strong text generation capabilities
2. Good understanding of structured data
3. Affordable pricing with a free tier
4. Reliable API availability

The API call includes parameters to control the generation:

```javascript
const response = await axios.post(
  "https://api.cohere.ai/v1/generate",
  {
    model: "command",
    prompt: prompt,
    max_tokens: 1024,
    temperature: 0.3,
    stop_sequences: [],
    return_likelihoods: "NONE",
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      "Content-Type": "application/json",
    },
  }
);
```

### Robust Error Handling

The system includes multiple fallback mechanisms to ensure users always get recommendations:

1. **Primary AI Recommendation**: Uses Cohere API to get intelligent, contextual job matches
2. **First Fallback**: If the AI fails, uses a skill-matching algorithm with weighted scoring
3. **Final Fallback**: If all else fails, uses a simple skill-matching algorithm

This ensures a smooth user experience even if there are issues with the AI response.

## Code Architecture

The application follows a standard architecture for a full-stack MERN (MongoDB, Express, React, Node.js) application:

### Backend Architecture

- **server.js**: Main entry point for the Express server
- **routes/**: API route definitions
- **controllers/**: Business logic for each route
- **models/**: Mongoose schemas and models
- **middleware/**: Custom middleware (auth, error handling)

### Frontend Architecture

- **src/App.jsx**: Main component with routing
- **src/pages/**: Page components for different routes
- **src/components/**: Reusable UI components
- **src/contexts/**: React context for authentication
- **src/services/**: API service functions

## Deployment

### Backend Deployment (e.g., Render, Railway, Fly.io)

1. Create an account on your chosen platform
2. Create a new web service and connect your repository
3. Set the build command: `npm install`
4. Set the start command: `npm start`
5. Add environment variables as defined in the `.env` file
6. Deploy the service

### Frontend Deployment (e.g., Netlify, Vercel)

1. Create an account on your chosen platform
2. Create a new site and connect your repository
3. Set the build command: `npm run build`
4. Set the publish directory: `dist` (Vite's output directory)
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```
6. Deploy the site

## Trade-offs and Assumptions

1. **Authentication**: Implemented a simple JWT-based authentication system. In a production environment, you might want to add features like email verification, password reset, and refresh tokens.

2. **Job Data**: The application uses a seeded dataset of jobs. In a real-world scenario, this would be connected to a job board API or have an admin interface for job management.

3. **AI Integration**: The system uses a simple but effective prompt to get job recommendations. More advanced implementations could include:

   - Fine-tuned models for job matching
   - More sophisticated scoring algorithms
   - Learning from user feedback on recommendations

4. **Performance**: The current implementation fetches all jobs for the AI to analyze. With a large job database, you would need pagination and pre-filtering based on key parameters.

5. **Security**: Basic security measures are implemented, but a production system would need additional hardening, rate limiting, and perhaps HTTPS-only cookies.

## License

This project is licensed under the MIT License.
