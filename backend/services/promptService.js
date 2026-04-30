import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PromptService {
  constructor() {
    this.rubricData = this.loadRubricData();
  }

  loadRubricData() {
    try {
      const rubricPath = join(__dirname, '../data/rubric.json');
      return JSON.parse(readFileSync(rubricPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load rubric data:', error.message);
      return this.createFallbackRubric();
    }
  }

  generateAnalysisPrompt(transcript) {
    return `
You are an expert analyst for DeepThought's Fellow program. Your task is to analyze supervisor feedback transcripts and provide structured assessments.

## RUBRIC FRAMEWORK

### Performance Bands (1-10 Scale):

**Need Attention (1-3):**
- 1: Not Interested - Disengaged, no effort
- 2: Lacks Discipline - Works only when told, no initiative
- 3: Motivated but Directionless - Enthusiasm without focus

**Productivity (4-6):**
- 4: Careless and Inconsistent - Output exists but quality varies
- 5: Consistent Performer - Reliable, meets standards
- 6: Reliable and Productive - High trust, efficient execution

**Performance (7-10):**
- 7: Problem Identifier - Spots patterns others miss
- 8: Problem Solver - Builds solutions, not just reports
- 9: Innovative and Experimental - Tests multiple approaches
- 10: Exceptional Performer - Flawless execution, organizational impact

### CRITICAL BOUNDARY: 6 vs 7
- Score 6: "Does everything I give him. Very reliable." (executes assigned tasks)
- Score 7: "She noticed rejection rate goes up on Mondays and started tracking why." (identifies problems supervisor didn't mention)

### TWO LAYERS OF WORK
- Layer 1 (Execution): Meetings, tracking, coordination, visible work
- Layer 2 (Systems Building): SOPs, trackers, accountability structures, persistent processes
- Key question: If Fellow left tomorrow, would any system continue running?

### 8 BUSINESS KPIS
- Lead Generation, Lead Conversion, Upselling, Cross-selling
- NPS (Customer Satisfaction), PAT (Profitability)
- TAT (Turnaround Time), Quality (Defect rates)

### 4 ASSESSMENT DIMENSIONS
1. Driving Execution - Getting things done, follow-up, initiative
2. Systems Building - Creating persistent tools/processes
3. KPI Impact - Connecting work to business outcomes
4. Change Management - Getting people to adopt new processes

### SUPERVISOR BIASES TO ACCOUNT FOR
- Helpfulness bias: "She handles all my calls" sounds like 8 but is 5-6
- Presence bias: "Always on floor" rated higher than "building trackers"
- Halo/horn effect: One story colors entire assessment
- Recency bias: Remembers last 2 weeks, not full tenure

## YOUR TASK

Analyze this supervisor transcript and return a JSON object with:

1. **score**: Object with value (1-10), label, band, justification, confidence
2. **evidence**: Array of quotes with signal (positive/negative/neutral), dimension, interpretation
3. **kpiMapping**: Array of KPIs with evidence and systemOrPersonal tags
4. **gaps**: Array of missing assessment dimensions with details
5. **followUpQuestions**: Array of 3-5 questions targeting specific gaps

## TRANSCRIPT TO ANALYZE:

${transcript}

## EXPECTED OUTPUT FORMAT:

Return ONLY valid JSON. No commentary, no explanations, just the JSON object:

{
  "score": {
    "value": 6,
    "label": "Reliable and Productive",
    "band": "Productivity",
    "justification": "Clear explanation citing specific evidence",
    "confidence": "medium"
  },
  "evidence": [
    {
      "quote": "Exact quote from transcript",
      "signal": "positive",
      "dimension": "execution",
      "interpretation": "What this quote reveals"
    }
  ],
  "kpiMapping": [
    {
      "kpi": "Quality",
      "evidence": "Supporting evidence",
      "systemOrPersonal": "system"
    }
  ],
  "gaps": [
    {
      "dimension": "systems_building",
      "detail": "What was missing from transcript"
    }
  ],
  "followUpQuestions": [
    {
      "question": "Specific question to ask",
      "targetGap": "systems_building",
      "lookingFor": "What information this question seeks"
    }
  ]
}

Remember: The AI suggests, the human decides. Your analysis is a draft for review.
`.trim();
  }

  createFallbackRubric() {
    return {
      rubric: {
        name: "DT Fellow Performance Rubric",
        scale: "1-10",
        bands: [],
        criticalBoundary: {
          boundary: "6 vs 7",
          description: "6 executes tasks, 7 identifies problems"
        }
      },
      assessmentDimensions: [],
      kpis: []
    };
  }

  getRubricData() {
    return this.rubricData;
  }
}

export default new PromptService();
