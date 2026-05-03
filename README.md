# ⚡ QA AI Assistant Pro

A professional-grade AI assistant designed for QA Engineers to streamline Jira workflows, automate test case generation, and manage defect reporting with a premium Dashboard experience.

![QA Dashboard](https://img.shields.io/badge/UI-Neo--Glassmorphism-blueviolet)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![AI Models](https://img.shields.io/badge/AI-Groq%20%7C%20OpenAI%20%7C%20Gemini%20%7C%20Ollama-orange)

## 🚀 Key Features

- **Jira Cloud Integration**: Seamlessly fetch user stories and requirements directly from Jira.
- **Multi-Model Intelligence**: Switch between **Groq (Llama 3.1)**, **OpenAI (GPT-4o)**, **Gemini 1.5**, and local **Ollama** models.
- **Automated Test Planning**: Generate functional, negative, and boundary test cases in seconds using context-aware AI.
- **Professional Defect Studio**: Create high-quality bug reports with "AI Smart Fill" and push them directly to Jira.
- **Premium Dashboard UI**: A state-of-the-art Neo-Glassmorphism interface with dark mode and responsive design.

## 🛠️ Tech Stack

- **Frontend**: React.js, Lucide Icons, Axios.
- **Backend**: Node.js, Express, Jira REST API.
- **Design**: Vanilla CSS with Glassmorphism foundations.

## 📦 Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Git](https://git-scm.com/)
- A Jira Cloud account

### 2. Backend Setup
```bash
cd backend
npm install
node index.js
```
The server will start on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## ⚙️ Configuration

Once the app is running, click the **Settings (⚙️)** icon in the sidebar to configure your environment:
- **Jira**: Domain, Email, and API Token.
- **AI Keys**: Groq, OpenAI, or Gemini keys.
- **Ollama**: Ensure Ollama is running locally on port 11434.

## 🤝 Contributing
Feel free to open issues or submit pull requests to enhance the QA AI Assistant.

---
Built with ❤️ for QA Engineers.
