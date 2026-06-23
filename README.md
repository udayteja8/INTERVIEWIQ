# InterviewIQ – AI Powered Adaptive Interview Coach

## Overview

InterviewIQ is an AI-powered interview preparation platform designed to simulate realistic technical interviews through voice interaction and adaptive questioning. The platform helps students and job seekers prepare for interviews by generating personalized questions based on their resume or selected technical topics, evaluating responses, and providing detailed performance feedback.

The system combines resume analysis, AI-driven question generation, voice-based interaction, answer evaluation, and performance tracking into a single interview preparation platform.



## Problem Statement

Many students struggle to prepare effectively for technical interviews due to a lack of personalized guidance, realistic interview simulations, and actionable feedback. Existing interview preparation platforms often provide static question sets and limited evaluation mechanisms.

InterviewIQ addresses this challenge by delivering personalized AI-generated interviews, adaptive follow-up questioning, communication assessment, and comprehensive performance analysis.



## Key Features

### Resume-Based Interview Generation

* Upload a resume in PDF format.
* AI analyzes skills, projects, and experience.
* Generates personalized interview questions.

### Topic-Based Interview Practice

* Select topics such as Python, Java, MERN Stack, DSA, AI/ML, DBMS, etc.
* Receive domain-specific interview questions.

### Voice-Based Interview Experience

* AI asks questions using Text-to-Speech.
* Users answer through microphone input.
* Creates a realistic interview environment.

### AI-Powered Evaluation

* Evaluates technical accuracy.
* Assesses communication quality.
* Provides strengths and improvement areas.

### Adaptive Follow-Up Questions

* Generates contextual follow-up questions based on user responses.
* Simulates real interviewer behavior.

### Performance Reports

* Question-wise evaluation.
* Technical and communication scores.
* Detailed feedback and recommendations.

### Interview History Dashboard

* Stores completed interview sessions.
* Allows users to review previous performance.



## Technology Stack

### Frontend

* React.js
* Vite
* Bootstrap
* Axios
* React Router DOM
* Web Speech API

### Backend

* Flask
* Flask-CORS
* Python
* PyPDF2
* bcrypt

### Artificial Intelligence

* Groq Cloud API
* Llama 3.1 8B Instant

### Database

* MongoDB Atlas


## System Architecture

The InterviewIQ architecture consists of four major layers:

### 1. Frontend Layer

* React.js
* Vite
* Bootstrap
* Web Speech API

Responsible for:

* User Authentication
* Resume Upload
* Topic Selection
* Voice Interaction
* Report Visualization

### 2. Backend Layer

* Flask
* Flask-CORS

Responsible for:

* Resume Processing
* Question Generation
* Answer Evaluation
* Follow-up Question Generation
* Report Generation

### 3. AI Layer

* Groq Cloud API
* Llama 3.1 8B Instant

Responsible for:

* Resume Analysis
* Personalized Interview Questions
* Answer Assessment
* Feedback Generation

### 4. Database Layer

* MongoDB Atlas

Responsible for:

* User Information Storage
* Interview History
* Reports and Analytics




## System Workflow

1. User registers or logs in.
2. User uploads a resume or selects a technical topic.
3. AI analyzes the resume/topic.
4. Personalized interview questions are generated.
5. Questions are spoken using Text-to-Speech.
6. User answers using voice input.
7. AI evaluates responses for technical and communication quality.
8. Follow-up questions are generated dynamically.
9. Interview results are compiled into a detailed report.
10. Interview history is stored in MongoDB Atlas.


## Project Structure

```text
InterviewIQ
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── assets
│   └── services
│
├── backend
│   ├── routes
│   ├── services
│   ├── database
│   ├── app.py
│   └── requirements.txt
│
├── README.md
└── .gitignore
```



## Installation Guide

### Clone Repository

```bash
git clone https://github.com/yourusername/interviewiq.git
cd interviewiq
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```



## Environment Variables

Create a `.env` file inside the backend directory.

```env
GROQ_API_KEY=your_api_key
MONGO_URI=your_mongodb_uri
SECRET_KEY=your_secret_key
```



## Usage Instructions

1. Register or log in to the platform.
2. Upload your resume or select a technical topic.
3. Start the interview session.
4. Allow microphone access.
5. Answer questions verbally.
6. Complete all interview rounds.
7. View your final performance report.
8. Access previous interview sessions from the dashboard.



## API Endpoints

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| POST   | /upload-resume      | Upload and analyze resume    |
| POST   | /generate-questions | Generate interview questions |
| POST   | /submit-answer      | Submit answer for evaluation |
| POST   | /next-question      | Generate follow-up question  |
| POST   | /final-report       | Generate final report        |
| POST   | /save-interview     | Save interview session       |
| GET    | /history/<email>    | Retrieve interview history   |


## Future Enhancements

* Video Interview Analysis
* Company-Specific Interview Modes
* Coding Interview Evaluation
* AI-Generated Learning Roadmaps
* Performance Analytics Dashboard
* Multi-Language Interview Support
* Resume Improvement Suggestions
* Mock HR Interview Module



## Contributors

### Pendem Uday Teja

Computer Science and Engineering
Chaitanya Bharathi Institute of Technology (CBIT)

### Ch. Ratnamala Reddy

Computer Science and Engineering
Chaitanya Bharathi Institute of Technology (CBIT)



## License

This project was developed for educational, research, and hackathon purposes.



## Conclusion

InterviewIQ provides a comprehensive AI-powered interview preparation experience by integrating resume analysis, adaptive questioning, voice-based interaction, answer evaluation, and performance tracking into a unified platform. The system enables users to improve both technical knowledge and communication skills through personalized and realistic interview practice sessions.
