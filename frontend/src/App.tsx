import { useState } from 'react';
import axios from 'axios';
import './App.css';

// Types for the analysis response
interface Evidence {
  quote: string;
  signal: 'positive' | 'negative' | 'neutral';
  dimension: string;
  interpretation: string;
}

interface KPIMapping {
  kpi: string;
  evidence: string;
  systemOrPersonal: 'system' | 'personal';
}

interface Gap {
  dimension: string;
  detail: string;
}

interface FollowUpQuestion {
  question: string;
  targetGap: string;
  lookingFor: string;
}

interface Score {
  value: number;
  label: string;
  band: string;
  justification: string;
  confidence: 'low' | 'medium' | 'high';
}

interface Analysis {
  score: Score;
  evidence: Evidence[];
  kpiMapping: KPIMapping[];
  gaps: Gap[];
  followUpQuestions: FollowUpQuestion[];
}

function App() {
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sampleTranscripts, setSampleTranscripts] = useState<any[]>([]);

  // Load sample transcripts on mount
  useState(() => {
    fetchSampleTranscripts();
  });

  const fetchSampleTranscripts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/samples');
      setSampleTranscripts(response.data.transcripts);
    } catch (err) {
      console.error('Error loading sample transcripts:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await axios.post('http://localhost:3001/api/analyze', {
        transcript: transcript.trim()
      });

      if (response.data.success) {
        setAnalysis(response.data.analysis);
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze transcript. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleTranscript = (sampleText: string) => {
    setTranscript(sampleText);
    setAnalysis(null);
    setError('');
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return '#ef4444'; // red
    if (score <= 6) return '#f59e0b'; // amber  
    return '#10b981'; // green
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Trinethra Supervisor Feedback Analyzer</h1>
        <p>AI-assisted analysis of DT Fellow performance transcripts</p>
      </header>

      <main className="main">
        <div className="input-section">
          <div className="transcript-input">
            <label htmlFor="transcript">Supervisor Transcript</label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the supervisor transcript here..."
              rows={12}
            />
          </div>

          <div className="sample-transcripts">
            <h3>Sample Transcripts</h3>
            <div className="sample-buttons">
              {sampleTranscripts.map((sample, index) => (
                <button
                  key={sample.id}
                  onClick={() => loadSampleTranscript(sample.transcript)}
                  className="sample-btn"
                >
                  {sample.fellow.name} at {sample.company.name}
                </button>
              ))}
            </div>
          </div>

          <div className="actions">
            <button
              onClick={handleAnalyze}
              disabled={loading || !transcript.trim()}
              className="analyze-btn"
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}
        </div>

        {analysis && (
          <div className="analysis-section">
            <div className="score-card">
              <h2>Performance Score</h2>
              <div className="score-display" style={{ color: getScoreColor(analysis.score.value) }}>
                <span className="score-value">{analysis.score.value}/10</span>
                <span className="score-label">{analysis.score.label}</span>
              </div>
              <div className="score-band">{analysis.score.band}</div>
              <p className="justification">{analysis.score.justification}</p>
              <div className="confidence">Confidence: {analysis.score.confidence}</div>
            </div>

            <div className="evidence-section">
              <h2>Extracted Evidence</h2>
              <div className="evidence-list">
                {analysis.evidence.map((item, index) => (
                  <div key={index} className="evidence-item">
                    <div className="evidence-quote">
                      "{item.quote}"
                    </div>
                    <div className="evidence-meta">
                      <span className="signal" style={{ color: getSignalColor(item.signal) }}>
                        {item.signal}
                      </span>
                      <span className="dimension">{item.dimension}</span>
                    </div>
                    <div className="interpretation">{item.interpretation}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="kpi-section">
              <h2>KPI Mapping</h2>
              <div className="kpi-list">
                {analysis.kpiMapping.map((item, index) => (
                  <div key={index} className="kpi-item">
                    <div className="kpi-name">{item.kpi}</div>
                    <div className="kpi-evidence">{item.evidence}</div>
                    <div className="kpi-type">
                      Type: <span className={item.systemOrPersonal}>{item.systemOrPersonal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gaps-section">
              <h2>Gap Analysis</h2>
              <div className="gaps-list">
                {analysis.gaps.map((gap, index) => (
                  <div key={index} className="gap-item">
                    <div className="gap-dimension">{gap.dimension}</div>
                    <div className="gap-detail">{gap.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="questions-section">
              <h2>Follow-up Questions</h2>
              <div className="questions-list">
                {analysis.followUpQuestions.map((q, index) => (
                  <div key={index} className="question-item">
                    <div className="question-text">{q.question}</div>
                    <div className="question-meta">
                      <span className="target-gap">Target: {q.targetGap}</span>
                      <span className="looking-for">Looking for: {q.lookingFor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;