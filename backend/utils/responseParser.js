class ResponseParser {
  parseAnalysis(rawResponse) {
    try {
      console.log('Parsing LLM response...');
      
      // Try direct JSON parse first
      if (this.isValidJSON(rawResponse)) {
        const parsed = JSON.parse(rawResponse);
        return this.validateAndCleanAnalysis(parsed);
      }

      // Try to extract JSON from text
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return this.validateAndCleanAnalysis(extracted);
      }

      // Fallback: structured extraction from text
      return this.extractFromText(rawResponse);

    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);
      return this.createFallbackAnalysis(rawResponse);
    }
  }

  isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  validateAndCleanAnalysis(analysis) {
    // Ensure required fields exist
    const cleaned = {
      score: analysis.score || this.createDefaultScore(),
      evidence: Array.isArray(analysis.evidence) ? analysis.evidence : [],
      kpiMapping: Array.isArray(analysis.kpiMapping) ? analysis.kpiMapping : [],
      gaps: Array.isArray(analysis.gaps) ? analysis.gaps : [],
      followUpQuestions: Array.isArray(analysis.followUpQuestions) ? analysis.followUpQuestions : []
    };

    // Clean and validate each section
    cleaned.score = this.cleanScore(cleaned.score);
    cleaned.evidence = cleaned.evidence.map(item => this.cleanEvidence(item)).filter(Boolean);
    cleaned.kpiMapping = cleaned.kpiMapping.map(item => this.cleanKPI(item)).filter(Boolean);
    cleaned.gaps = cleaned.gaps.map(item => this.cleanGap(item)).filter(Boolean);
    cleaned.followUpQuestions = cleaned.followUpQuestions.map(item => this.cleanQuestion(item)).filter(Boolean);

    return cleaned;
  }

  cleanScore(score) {
    return {
      value: Math.max(1, Math.min(10, parseInt(score.value) || 5)),
      label: score.label || this.getScoreLabel(score.value),
      band: score.band || this.getScoreBand(score.value),
      justification: score.justification || 'No justification provided',
      confidence: score.confidence || 'medium'
    };
  }

  cleanEvidence(evidence) {
    if (!evidence.quote) return null;
    return {
      quote: evidence.quote.trim(),
      signal: evidence.signal || 'neutral',
      dimension: evidence.dimension || 'execution',
      interpretation: evidence.interpretation || 'No interpretation provided'
    };
  }

  cleanKPI(kpi) {
    if (!kpi.kpi) return null;
    return {
      kpi: kpi.kpi,
      evidence: kpi.evidence || 'No evidence provided',
      systemOrPersonal: kpi.systemOrPersonal || 'personal'
    };
  }

  cleanGap(gap) {
    if (!gap.dimension) return null;
    return {
      dimension: gap.dimension,
      detail: gap.detail || 'No details provided'
    };
  }

  cleanQuestion(question) {
    if (!question.question) return null;
    return {
      question: question.question,
      targetGap: question.targetGap || 'general',
      lookingFor: question.lookingFor || 'Additional information'
    };
  }

  extractFromText(text) {
    // Fallback extraction using regex patterns
    console.log('🔄 Using fallback text extraction...');
    
    const analysis = {
      score: this.createDefaultScore(),
      evidence: [],
      kpiMapping: [],
      gaps: [],
      followUpQuestions: []
    };

    // Extract score
    const scoreMatch = text.match(/(\d+)\/?10?/i);
    if (scoreMatch) {
      analysis.score.value = parseInt(scoreMatch[1]);
      analysis.score.label = this.getScoreLabel(analysis.score.value);
    }

    // Extract evidence quotes
    const quoteMatches = text.match(/"([^"]+)"/g);
    if (quoteMatches) {
      analysis.evidence = quoteMatches.slice(0, 5).map(quote => ({
        quote: quote.replace(/"/g, ''),
        signal: 'neutral',
        dimension: 'execution',
        interpretation: 'Extracted from transcript'
      }));
    }

    return analysis;
  }

  createFallbackAnalysis(rawResponse) {
    console.log('Creating fallback analysis...');
    return {
      score: {
        value: 5,
        label: 'Consistent Performer',
        band: 'Productivity',
        justification: 'Unable to parse LLM response. Manual review required.',
        confidence: 'low'
      },
      evidence: [{
        quote: 'Analysis failed to parse properly',
        signal: 'negative',
        dimension: 'technical',
        interpretation: 'Technical issue with response parsing'
      }],
      kpiMapping: [],
      gaps: [{
        dimension: 'technical',
        detail: 'Unable to process LLM response'
      }],
      followUpQuestions: [{
        question: 'Please retry the analysis with proper transcript input',
        targetGap: 'technical',
        lookingFor: 'Successful analysis completion'
      }]
    };
  }

  createDefaultScore() {
    return {
      value: 5,
      label: 'Consistent Performer',
      band: 'Productivity',
      justification: 'Default score - analysis incomplete',
      confidence: 'low'
    };
  }

  getScoreLabel(score) {
    const labels = {
      1: 'Not Interested',
      2: 'Lacks Discipline', 
      3: 'Motivated but Directionless',
      4: 'Careless and Inconsistent',
      5: 'Consistent Performer',
      6: 'Reliable and Productive',
      7: 'Problem Identifier',
      8: 'Problem Solver',
      9: 'Innovative and Experimental',
      10: 'Exceptional Performer'
    };
    return labels[score] || 'Unknown';
  }

  getScoreBand(score) {
    if (score <= 3) return 'Need Attention';
    if (score <= 6) return 'Productivity';
    return 'Performance';
  }
}

export default new ResponseParser();
