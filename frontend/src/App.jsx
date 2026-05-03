import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, RefreshCcw, Play, Key, Database, X, Sparkles, 
  FileText, CheckCircle, Cpu, Bug, AlertCircle, Check, 
  LayoutDashboard, ClipboardList, AlertOctagon, Zap, ShieldCheck 
} from 'lucide-react';
import './App.css';

const modelVersions = {
  groq: [
    { label: 'Llama 3.1 8B', value: 'llama-3.1-8b-instant' },
    { label: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile' },
    { label: 'Mixtral 8x7b', value: 'mixtral-8x7b-32768' }
  ],
  openai: [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
  ],
  gemini: [
    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' }
  ],
  ollama: [
    { label: 'Phi-3', value: 'phi3' },
    { label: 'Mistral', value: 'mistral' },
    { label: 'Llama 3', value: 'llama3' }
  ]
};

const App = () => {
  const [activeTab, setActiveTab] = useState('testcases');
  const [jiraInput, setJiraInput] = useState({ ticketId: '', content: '' });
  const [testCases, setTestCases] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [selectedVersion, setSelectedVersion] = useState(modelVersions.groq[0].value);
  
  const [defectForm, setDefectForm] = useState({
    summary: '', description: '', steps: '', expectedResult: '', actualResult: '', priority: 'Medium'
  });
  const [createdTicket, setCreatedTicket] = useState(null);

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('qa_app_settings');
    return saved ? JSON.parse(saved) : {
      jiraDomain: '', jiraEmail: '', jiraToken: '', projectKey: 'SCRUM',
      openaiKey: '', geminiKey: '', groqKey: ''
    };
  });

  useEffect(() => localStorage.setItem('qa_app_settings', JSON.stringify(config)), [config]);
  useEffect(() => { setSelectedVersion(modelVersions[selectedProvider][0].value); }, [selectedProvider]);

  const fetchJiraTicket = async () => {
    if (!jiraInput.ticketId) return;
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/jira/fetch', {
        ticketId: jiraInput.ticketId, domain: config.jiraDomain, email: config.jiraEmail, apiToken: config.jiraToken
      });
      setJiraInput({ ...jiraInput, content: `TITLE: ${res.data.summary}\n\nDESCRIPTION:\n${res.data.description}` });
    } catch (err) { alert("Fetch failed. Check Settings."); }
    setIsLoading(false);
  };

  const generateTestCases = async () => {
    if (!jiraInput.content) return;
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/generate', {
        jiraContent: jiraInput.content, selectedModel: selectedProvider, modelVersion: selectedVersion, apiKeys: config
      });
      setTestCases(res.data.reply);
    } catch (err) { alert("AI Generation failed."); }
    setIsLoading(false);
  };

  const generateDefectAI = async () => {
    setIsLoading(true);
    try {
      const prompt = `Act as QA Engineer. Create a bug report from the following issue: ${jiraInput.content || "General application error"}. Include: Summary, Steps, Expected Result, Actual Result. Keep it short and structured.`;
      const res = await axios.post('http://localhost:5000/api/generate', {
        jiraContent: prompt, selectedModel: selectedProvider, modelVersion: selectedVersion, apiKeys: config
      });
      const lines = res.data.reply.split('\n');
      setDefectForm({
        ...defectForm,
        summary: lines[0]?.replace(/summary:/i, '').trim() || "AI Generated Bug",
        description: res.data.reply,
        steps: res.data.reply.split(/expected result/i)[0]?.split(/steps/i)[1]?.trim() || "See description",
        expectedResult: res.data.reply.split(/expected result/i)[1]?.split(/actual result/i)[0]?.trim() || "",
        actualResult: res.data.reply.split(/actual result/i)[1]?.trim() || ""
      });
    } catch (err) { alert("AI Generation failed."); }
    setIsLoading(false);
  };

  const createJiraDefect = async () => {
    if (!defectForm.summary) return alert("Summary is required.");
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/jira/defect', {
        ...defectForm, ...config
      });
      setCreatedTicket(res.data.ticketId);
      alert(`Defect created: ${res.data.ticketId}`);
    } catch (err) { alert("Creation failed."); }
    setIsLoading(false);
  };

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Zap color="var(--primary)" fill="var(--primary)" size={32} />
          <h2>QA ENGINEER <span style={{color: 'var(--text-muted)'}}>PRO</span></h2>
        </div>
        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'testcases' ? 'active' : ''}`} onClick={() => setActiveTab('testcases')}>
            <ClipboardList size={20} /> Test Case Gen
          </div>
          <div className={`nav-item ${activeTab === 'defects' ? 'active' : ''}`} onClick={() => setActiveTab('defects')}>
            <AlertOctagon size={20} /> Defect Creator
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item" onClick={() => setShowSettings(true)}>
            <Settings size={20} /> Settings
          </div>
        </div>
      </aside>

      <main className="main-viewport">
        <nav className="top-nav">
          <div className="model-pill">
            <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="ollama">Ollama</option>
            </select>
            <div style={{width: 1, height: 16, background: 'var(--glass-border)', alignSelf: 'center'}} />
            <select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
              {modelVersions[selectedProvider].map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div className="status-indicator">
            <span style={{fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)'}}>SYSTEM STATUS: </span>
            <span style={{fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)'}}>● ONLINE</span>
          </div>
        </nav>

        <div className="content-scroll">
          {activeTab === 'testcases' ? (
            <div className="dashboard-grid">
              <section className="glass-card">
                <div className="card-header">
                  <h3><FileText size={22} color="var(--primary)" /> Jira Integration</h3>
                  <div className="status-badge">Step 1</div>
                </div>
                <div className="input-group">
                  <label>Ticket ID</label>
                  <div style={{display: 'flex', gap: '0.75rem'}}>
                    <input style={{flex: 1}} placeholder="e.g. PROJ-101" value={jiraInput.ticketId} onChange={(e)=>setJiraInput({...jiraInput, ticketId: e.target.value})} />
                    <button className="action-button" style={{padding: '0 1.5rem'}} onClick={fetchJiraTicket} disabled={isLoading}><RefreshCcw size={18} className={isLoading ? 'spin' : ''} /></button>
                  </div>
                </div>
                <div className="input-group">
                  <label>Requirement Data</label>
                  <textarea style={{height: 250}} placeholder="Jira story details will appear here..." value={jiraInput.content} onChange={(e)=>setJiraInput({...jiraInput, content: e.target.value})} />
                </div>
                <button className="action-button" onClick={generateTestCases} disabled={isLoading || !jiraInput.content}>
                  <Sparkles size={18} /> Generate QA Test Plan
                </button>
              </section>

              <section className="glass-card">
                <div className="card-header">
                  <h3><ShieldCheck size={22} color="var(--success)" /> Output Strategy</h3>
                  <div className="status-badge">Step 2</div>
                </div>
                <div className="test-cases-display" style={{height: '100%', minHeight: 450}}>
                  {isLoading ? <div className="loading-wave"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div> : <pre>{testCases || "Results will stream here..."}</pre>}
                </div>
              </section>
            </div>
          ) : (
            <div className="dashboard-grid">
              <section className="glass-card" style={{gridColumn: '1 / -1'}}>
                <div className="card-header">
                  <h3><Bug size={24} color="var(--error)" /> Professional Defect Studio</h3>
                  <button className="action-button" style={{background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', boxShadow: 'none'}} onClick={generateDefectAI} disabled={isLoading}><Zap size={16} color="var(--secondary)" /> AI Smart Fill</button>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                  <div className="input-group">
                    <label>Bug Summary</label>
                    <input placeholder="Short descriptive title" value={defectForm.summary} onChange={(e)=>setDefectForm({...defectForm, summary: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Severity Level</label>
                    <select value={defectForm.priority} onChange={(e)=>setDefectForm({...defectForm, priority: e.target.value})}>
                      <option value="High">High (Blocking)</option>
                      <option value="Medium">Medium (Functional)</option>
                      <option value="Low">Low (Visual/Minor)</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Steps to Reproduce</label>
                  <textarea style={{height: 120}} placeholder="1. Open app\n2. Click..." value={defectForm.steps} onChange={(e)=>setDefectForm({...defectForm, steps: e.target.value})} />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                  <div className="input-group">
                    <label>Expected Result</label>
                    <input value={defectForm.expectedResult} onChange={(e)=>setDefectForm({...defectForm, expectedResult: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Actual Result</label>
                    <input value={defectForm.actualResult} onChange={(e)=>setDefectForm({...defectForm, actualResult: e.target.value})} />
                  </div>
                </div>
                <button className="action-button error-btn" onClick={createJiraDefect} disabled={isLoading}>
                  <AlertCircle size={20} /> Push to Jira Production
                </button>
                {createdTicket && <div className="success-banner" style={{marginTop: '1rem'}}><Check size={16} /> Created Ticket: <strong>{createdTicket}</strong></div>}
              </section>
            </div>
          )}
        </div>
      </main>

      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-header" style={{marginBottom: '2rem'}}>
              <h2>System Configuration</h2>
              <button className="icon-btn" onClick={()=>setShowSettings(false)}><X size={24} /></button>
            </div>
            <div className="settings-scroll" style={{maxHeight: 400, overflowY: 'auto', paddingRight: '1rem'}}>
              <div className="setting-section" style={{marginBottom: '2rem'}}>
                <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1.5rem'}}>Jira Environment</h4>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>Atlassian Domain</label>
                  <input placeholder="e.g. mycompany" value={config.jiraDomain} onChange={(e)=>setConfig({...config, jiraDomain: e.target.value})} />
                </div>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>Auth Email</label>
                  <input placeholder="yourname@company.com" value={config.jiraEmail} onChange={(e)=>setConfig({...config, jiraEmail: e.target.value})} />
                </div>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>API Token</label>
                  <input type="password" placeholder="••••••••••••" value={config.jiraToken} onChange={(e)=>setConfig({...config, jiraToken: e.target.value})} />
                </div>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>Target Project Key</label>
                  <input placeholder="e.g. PROJ" value={config.projectKey} onChange={(e)=>setConfig({...config, projectKey: e.target.value})} />
                </div>
              </div>

              <div className="setting-section">
                <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1.5rem'}}>AI Access Keys</h4>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>Groq API Key</label>
                  <input type="password" placeholder="gsk-..." value={config.groqKey} onChange={(e)=>setConfig({...config, groqKey: e.target.value})} />
                </div>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>OpenAI API Key</label>
                  <input type="password" placeholder="sk-..." value={config.openaiKey} onChange={(e)=>setConfig({...config, openaiKey: e.target.value})} />
                </div>
                <div className="input-group" style={{marginBottom: '1rem'}}>
                  <label>Gemini API Key</label>
                  <input type="password" placeholder="Key here..." value={config.geminiKey} onChange={(e)=>setConfig({...config, geminiKey: e.target.value})} />
                </div>
              </div>
            </div>
            <button className="action-button" style={{width: '100%', marginTop: '2rem'}} onClick={()=>setShowSettings(false)}>Apply Configurations</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
