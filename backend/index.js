const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// A. Fetch Jira Ticket
app.post('/api/jira/fetch', async (req, res) => {
  const { ticketId, domain, email, apiToken } = req.body;
  
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\.atlassian\.net\/?$/, '');
    const url = `https://${cleanDomain}.atlassian.net/rest/api/3/issue/${ticketId}`;
    console.log("Fetching Jira from:", url);

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const response = await axios.get(url, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    });

    const issue = response.data.fields;
    let description = "";
    if (issue.description?.content) {
      description = issue.description.content
        .map(p => p.content?.map(t => t.text).join('') || '')
        .join('\n');
    }
    
    res.json({
      summary: issue.summary,
      description: description || "No description provided.",
      acceptanceCriteria: "Check Jira for specific AC field if custom."
    });
  } catch (error) {
    console.error("Jira error:", error.message);
    res.status(500).json({ error: "Failed to fetch Jira ticket. Check your credentials." });
  }
});

// B. Generate Test Cases / AI Content
app.post('/api/generate', async (req, res) => {
  const { jiraContent, selectedModel, modelVersion, apiKeys } = req.body;
  
  // Custom system prompt handling
  const fullPrompt = jiraContent.includes("Act as QA Engineer") 
    ? jiraContent 
    : `Act as QA Engineer. Generate test cases from below Jira story. Include functional, negative, and boundary cases. Keep answer clear and short.\n\nJIRA STORY:\n${jiraContent}`;

  try {
    let reply = "";
    if (selectedModel === 'openai') {
      const openai = new OpenAI({ apiKey: apiKeys.openaiKey });
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: fullPrompt }],
        model: modelVersion || "gpt-3.5-turbo",
      });
      reply = completion.choices[0].message.content;
    } 
    else if (selectedModel === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKeys.geminiKey);
      const model = genAI.getGenerativeModel({ model: modelVersion || "gemini-pro" });
      const result = await model.generateContent(fullPrompt);
      reply = (await result.response).text();
    } 
    else if (selectedModel === 'groq') {
      const groq = new OpenAI({ apiKey: apiKeys.groqKey, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: fullPrompt }],
        model: modelVersion || "llama-3.1-8b-instant",
      });
      reply = completion.choices[0].message.content;
    }
    else if (selectedModel === 'ollama') {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: modelVersion || 'phi3',
        prompt: fullPrompt,
        stream: false
      });
      reply = response.data.response;
    }

    res.json({ reply });
  } catch (error) {
    console.error("AI error:", error.message);
    res.status(500).json({ error: error.message || "AI Generation failed." });
  }
});

// C. Create Defect in Jira
app.post('/api/jira/defect', async (req, res) => {
  const { 
    summary, description, steps, expectedResult, actualResult, 
    priority, domain, email, apiToken, projectKey 
  } = req.body;
  
  const finalProjectKey = (projectKey || "SCRUM").toUpperCase();
  const combinedDescription = `STEPS TO REPRODUCE:\n${steps}\n\nEXPECTED RESULT:\n${expectedResult}\n\nACTUAL RESULT:\n${actualResult}\n\nDESCRIPTION:\n${description}`;

  const payload = {
    fields: {
      project: { key: finalProjectKey },
      summary: summary,
      description: combinedDescription,
      issuetype: { name: "Bug" }
    }
  };

  console.log("Sending payload to Jira (v2):", JSON.stringify(payload, null, 2));

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const response = await axios.post(`https://${domain}.atlassian.net/rest/api/2/issue`, payload, {
      headers: { 
        'Authorization': `Basic ${auth}`, 
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, ticketId: response.data.key });
  } catch (error) {
    console.error("Defect Creation Error:", error.response?.data || error.message);
    
    // Debug: Fetch projects to see valid keys
    try {
      const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
      
      // Check user identity
      const selfRes = await axios.get(`https://${domain}.atlassian.net/rest/api/3/myself`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      console.log("Authenticated as:", selfRes.data.displayName, `(${selfRes.data.emailAddress})`);

      const projectsRes = await axios.get(`https://${domain}.atlassian.net/rest/api/3/project`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      const keys = projectsRes.data.map(p => p.key);
      console.log("Valid project keys for this account:", keys);
    } catch (debugError) {
      console.error("Debug info fetch failed:", debugError.response?.data || debugError.message);
    }

    res.status(500).json({ error: "Failed to create defect in Jira. Valid project key is required." });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
