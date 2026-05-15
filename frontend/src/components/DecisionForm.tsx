'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WizardSteps } from './WizardSteps';
import { ChevronLeft, Trash2, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface DecisionFormData {
  decision: string;
  context: string;
  alternatives: string[];
  criteria: Array<{ name: string; weight: number }>;
  scores: Record<number, Record<number, number>>;
}

export function DecisionForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingCriteria, setIsSuggestingCriteria] = useState(false);
  const [isSuggestingAlternatives, setIsSuggestingAlternatives] = useState(false);
  const [isSuggestingScores, setIsSuggestingScores] = useState(false);
  const [aiCriteriaSuggestions, setAiCriteriaSuggestions] = useState<Array<{ name: string; weight: number }>>([]);
  const [aiAlternativeSuggestions, setAiAlternativeSuggestions] = useState<Array<{ name: string; description?: string }>>([]);
  const [formData, setFormData] = useState<DecisionFormData>({
    decision: '',
    context: '',
    alternatives: ['', ''],
    criteria: [{ name: '', weight: 5 }],
    scores: {},
  });

  const handleDecisionChange = (value: string) => {
    setFormData({ ...formData, decision: value });
  };

  const handleContextChange = (value: string) => {
    setFormData({ ...formData, context: value });
  };

  const handleAlternativeChange = (index: number, value: string) => {
    const newAlternatives = [...formData.alternatives];
    newAlternatives[index] = value;
    setFormData({ ...formData, alternatives: newAlternatives });
  };

  const addAlternative = () => {
    setFormData({
      ...formData,
      alternatives: [...formData.alternatives, ''],
    });
  };

  const removeAlternative = (index: number) => {
    setFormData({
      ...formData,
      alternatives: formData.alternatives.filter((_, i) => i !== index),
    });
  };

  const handleCriteriaChange = (index: number, name: string, weight: number) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { name, weight };
    setFormData({ ...formData, criteria: newCriteria });
  };

  const addCriteria = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: '', weight: 5 }],
    });
  };

  const removeCriteria = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
  };

  const handleScoreChange = (altIndex: number, criIndex: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [altIndex]: {
          ...(prev.scores[altIndex] || {}),
          [criIndex]: value,
        },
      },
    }));
  };

  const handleSuggestCriteria = async () => {
    try {
      setIsSuggestingCriteria(true);
      const { aiApi } = await import('@/lib/api');
      const res = await aiApi.suggestCriteria(formData.decision, formData.context);
      if (res.data && res.data.length > 0) {
        setAiCriteriaSuggestions(res.data);
      }
    } catch (err) {
      alert('Failed to get AI suggestions.');
    } finally {
      setIsSuggestingCriteria(false);
    }
  };

  const handleSuggestAlternatives = async () => {
    try {
      setIsSuggestingAlternatives(true);
      const { aiApi } = await import('@/lib/api');
      const validCriteria = formData.criteria.filter(c => c.name.trim() !== '');
      const res = await aiApi.suggestAlternatives(formData.decision, formData.context, validCriteria);
      if (res.data && res.data.length > 0) {
        setAiAlternativeSuggestions(res.data);
      }
    } catch (err) {
      alert('Failed to get AI suggestions.');
    } finally {
      setIsSuggestingAlternatives(false);
    }
  };

  const handleAiSuggestScores = async () => {
    setIsSuggestingScores(true);
    try {
      const { aiApi } = await import('@/lib/api');
      const validCris = formData.criteria.filter(c => c.name.trim() !== '');
      const validAlts = formData.alternatives.filter(a => a.trim() !== '');
      
      const res = await aiApi.suggestScores(
        formData.decision,
        formData.context,
        validCris.map(c => ({ name: c.name })),
        validAlts
      );

      if (res.data && res.data.length > 0) {
        setFormData(prev => {
          const newScores = { ...prev.scores };
          const pValidAlts = prev.alternatives.map((a, i) => ({ a, i })).filter(x => x.a.trim() !== '');
          const pValidCris = prev.criteria.map((c, i) => ({ c, i })).filter(x => x.c.name.trim() !== '');

          res.data.forEach((altScores, resAltIdx) => {
            const altData = pValidAlts[resAltIdx];
            if (!altData) return;
            
            if (!newScores[altData.i]) newScores[altData.i] = {};
            
            altScores.forEach((scoreValue, resCriIdx) => {
              const criData = pValidCris[resCriIdx];
              if (!criData) return;
              newScores[altData.i][criData.i] = scoreValue;
            });
          });

          return { ...prev, scores: newScores };
        });
      }
    } catch (err) {
      alert('Failed to get AI suggestions for scores.');
    } finally {
      setIsSuggestingScores(false);
    }
  };

  const canProceedToStep = (targetStep: number): boolean => {
    if (targetStep === 2) return formData.decision.trim().length > 0;
    if (targetStep === 3) {
      return formData.criteria.filter((c) => c.name.trim().length > 0).length >= 1;
    }
    if (targetStep === 4) {
      return (
        formData.alternatives.filter((alt) => alt.trim().length > 0).length >= 2
      );
    }
    if (targetStep === 5) {
      // Must have scores for all valid alternatives and valid criteria
      // BUG FIX: Check for undefined explicitly — value of 0 is a valid score
      const validAlts = formData.alternatives.map((a, i) => ({ a, i })).filter(x => x.a.trim().length > 0);
      const validCris = formData.criteria.map((c, i) => ({ c, i })).filter(x => x.c.name.trim().length > 0);
      for (const alt of validAlts) {
        for (const cri of validCris) {
          const score = formData.scores[alt.i]?.[cri.i];
          if (score === undefined || score === null || isNaN(score)) {
            return false;
          }
        }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (canProceedToStep(step + 1)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleAnalyze = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStep(6);
    await handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      const { decisionsApi } = await import('@/lib/api');
      
      // 1. Create Decision
      const decRes = await decisionsApi.create({
        title: formData.decision,
        description: formData.context,
      });
      const decisionId = decRes.data.id;

      // 2. Add Alternatives
      const validAlts = formData.alternatives.filter((alt) => alt.trim().length > 0);
      const altIds = [];
      for (const alt of validAlts) {
        const res = await decisionsApi.addAlternative(decisionId, alt);
        altIds.push(res.data.id);
      }

      // 3. Normalize Weights and Add Criteria (ensure total = 100%)
      const validCriteria = formData.criteria.filter((c) => c.name.trim().length > 0);
      const totalWeight = validCriteria.reduce((sum, c) => sum + c.weight, 0);
      const criIds = [];
      for (let i = 0; i < validCriteria.length; i++) {
        const cri = validCriteria[i];
        // Distribute to ensure last item makes total exactly 100.00
        const isLast = i === validCriteria.length - 1;
        const soFarTotal = criIds.length > 0
          ? validCriteria.slice(0, i).reduce((s, c) => s + parseFloat(((c.weight / totalWeight) * 100).toFixed(2)), 0)
          : 0;
        const percentage = isLast ? parseFloat((100 - soFarTotal).toFixed(2)) : parseFloat(((cri.weight / totalWeight) * 100).toFixed(2));
        const res = await decisionsApi.addCriteria(decisionId, cri.name, percentage);
        criIds.push(res.data.id);
      }

      // 4. Use Actual Scores from Form
      const scores = [];
      const validAltIndices = formData.alternatives.map((a, i) => ({ a, i })).filter(x => x.a.trim().length > 0).map(x => x.i);
      const validCriIndices = formData.criteria.map((c, i) => ({ c, i })).filter(x => x.c.name.trim().length > 0).map(x => x.i);
      
      for (let altIdx = 0; altIdx < validAltIndices.length; altIdx++) {
        for (let criIdx = 0; criIdx < validCriIndices.length; criIdx++) {
          const originalAltIdx = validAltIndices[altIdx];
          const originalCriIdx = validCriIndices[criIdx];
          
          scores.push({
            alternative_id: altIds[altIdx],
            criteria_id: criIds[criIdx],
            raw_value: formData.scores[originalAltIdx]?.[originalCriIdx] || 0,
          });
        }
      }
      await decisionsApi.upsertScores(decisionId, scores);

      // 5. Run Analysis with SAW method
      await decisionsApi.runAnalysis(decisionId, 'SAW');

      // 6. Redirect
      window.location.href = `/analysis/${decisionId}`;
    } catch (error) {
      console.error('Failed to submit decision:', error);
      alert('An error occurred while analyzing the decision. Please try again.');
      setStep(5); // Go back to review step on error
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <WizardSteps currentStep={step} totalSteps={6} />

      <div className="bg-card border border-border rounded-xl p-8 md:p-10 mb-8">
        {/* Step 1: Define Decision */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What Decision Are You Making?
              </h2>
              <p className="text-muted-foreground">
                Describe the decision you need to make and what you&apos;re trying to achieve.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Decision Title
                </label>
                <Input
                  placeholder="e.g., Which laptop to buy for programming?"
                  value={formData.decision}
                  onChange={(e) => handleDecisionChange(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Context & Details
                </label>
                <Textarea
                  placeholder="e.g., I need to choose which laptop to buy for programming and content creation..."
                  value={formData.context}
                  onChange={(e) => handleContextChange(e.target.value)}
                  className="bg-background border-border h-32"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Criteria */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Set Your Evaluation Criteria
                </h2>
                <p className="text-muted-foreground">
                  Define the factors that matter most to you in evaluating these alternatives.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleSuggestCriteria}
                disabled={isSuggestingCriteria || formData.decision.trim().length === 0}
                className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isSuggestingCriteria ? 'Thinking...' : 'AI Suggestion'}
              </Button>
            </div>

            <div className={`grid ${aiCriteriaSuggestions.length > 0 ? 'md:grid-cols-3' : 'grid-cols-1'} gap-8`}>
              <div className={`space-y-4 ${aiCriteriaSuggestions.length > 0 ? 'md:col-span-2' : ''}`}>
                {formData.criteria.map((criterion, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Criterion {index + 1}
                        </label>
                        <Input
                          placeholder="e.g., Price, Performance, Build Quality"
                          value={criterion.name}
                          onChange={(e) =>
                            handleCriteriaChange(index, e.target.value, criterion.weight)
                          }
                          className="bg-background border-border"
                        />
                      </div>
                      {formData.criteria.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCriteria(index)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-foreground">
                        Importance: {criterion.weight}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criterion.weight}
                        onChange={(e) =>
                          handleCriteriaChange(
                            index,
                            criterion.name,
                            parseInt(e.target.value)
                          )
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addCriteria}
                  className="w-full border-border text-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Criterion
                </Button>
              </div>

              {aiCriteriaSuggestions.length > 0 && (
                <div className="bg-[#bbf7d0] rounded-xl p-6 border border-[#86efac]">
                  <div className="flex items-center gap-2 mb-4 text-[#065f46]">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Brainstorming AI</h3>
                  </div>
                  <p className="text-sm text-[#065f46] mb-6">
                    Berdasarkan konteks keputusan Anda, AI menyarankan kriteria berikut:
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {aiCriteriaSuggestions.map((sug, idx) => (
                      <div key={idx} className="bg-white/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-semibold text-gray-900">{sug.name}</p>
                          <p className="text-xs text-gray-500">Weight: {sug.weight}/10</p>
                        </div>
                        <Button
                          size="icon"
                          className="w-8 h-8 bg-[#047857] hover:bg-[#065f46] text-white shrink-0 rounded-full"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              criteria: [
                                ...prev.criteria.filter(c => c.name.trim() !== ''),
                                { name: sug.name, weight: sug.weight }
                              ]
                            }));
                            setAiCriteriaSuggestions(prev => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSuggestCriteria}
                    disabled={isSuggestingCriteria}
                    className="w-full bg-[#022c22] hover:bg-[#064e3b] text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isSuggestingCriteria ? 'Thinking...' : 'Generate More Ideas'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Alternatives */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Add Your Alternatives
                </h2>
                <p className="text-muted-foreground">
                  List all the options you&apos;re considering for this decision.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleSuggestAlternatives}
                disabled={isSuggestingAlternatives || formData.decision.trim().length === 0}
                className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isSuggestingAlternatives ? 'Thinking...' : 'AI Suggestion'}
              </Button>
            </div>

            <div className={`grid ${aiAlternativeSuggestions.length > 0 ? 'md:grid-cols-3' : 'grid-cols-1'} gap-8`}>
              <div className={`space-y-4 ${aiAlternativeSuggestions.length > 0 ? 'md:col-span-2' : ''}`}>
                {formData.alternatives.map((alt, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      placeholder={`Alternative ${index + 1}`}
                      value={alt}
                      onChange={(e) => handleAlternativeChange(index, e.target.value)}
                      className="bg-background border-border flex-1"
                    />
                    {formData.alternatives.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAlternative(index)}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addAlternative}
                  className="w-full border-border text-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Alternative
                </Button>
              </div>

              {aiAlternativeSuggestions.length > 0 && (
                <div className="bg-[#bbf7d0] rounded-xl p-6 border border-[#86efac]">
                  <div className="flex items-center gap-2 mb-4 text-[#065f46]">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Brainstorming AI</h3>
                  </div>
                  <p className="text-sm text-[#065f46] mb-6">
                    Berdasarkan kriteria Anda, AI menyarankan alternatif berikut:
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {aiAlternativeSuggestions.map((sug, idx) => (
                      <div key={idx} className="bg-white/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
                        <div className="pr-2">
                          <p className="font-semibold text-gray-900 leading-tight">{sug.name}</p>
                          {sug.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-tight">{sug.description}</p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          className="w-8 h-8 bg-[#047857] hover:bg-[#065f46] text-white shrink-0 rounded-full"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              alternatives: [
                                ...prev.alternatives.filter(a => a.trim() !== ''),
                                sug.name
                              ]
                            }));
                            setAiAlternativeSuggestions(prev => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSuggestAlternatives}
                    disabled={isSuggestingAlternatives}
                    className="w-full bg-[#022c22] hover:bg-[#064e3b] text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isSuggestingAlternatives ? 'Thinking...' : 'Generate More Ideas'}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              You have {formData.alternatives.filter((alt) => alt.trim().length > 0).length} valid
              alternative{formData.alternatives.filter((alt) => alt.trim().length > 0).length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Step 4: Scores Matrix */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Score Your Alternatives
                </h2>
                <Button
                  onClick={handleAiSuggestScores}
                  disabled={isSuggestingScores || formData.alternatives.filter(a => a.trim() !== '').length === 0 || formData.criteria.filter(c => c.name.trim() !== '').length === 0}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isSuggestingScores ? 'Generating...' : 'AI Auto-Fill'}
                </Button>
              </div>
              <p className="text-muted-foreground">
                Evaluate each alternative against your criteria. Enter a score from 1 to 10, or exact values if applicable.
              </p>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Alternative / Criteria</th>
                    {formData.criteria
                      .map((c, i) => ({ c, i }))
                      .filter(x => x.c.name.trim().length > 0)
                      .map((x) => (
                        <th key={x.i} className="px-4 py-3 font-medium min-w-[120px] text-center">
                          {x.c.name}
                          <div className="text-[10px] lowercase mt-1 font-normal opacity-70">
                            (Weight: {x.c.weight}/10)
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {formData.alternatives
                    .map((a, i) => ({ a, i }))
                    .filter(x => x.a.trim().length > 0)
                    .map((alt) => (
                      <tr key={alt.i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                          {alt.a}
                        </td>
                        {formData.criteria
                          .map((c, i) => ({ c, i }))
                          .filter(x => x.c.name.trim().length > 0)
                          .map((cri) => (
                            <td key={cri.i} className="px-4 py-2">
                              <Input
                                type="number"
                                placeholder="1-10"
                                min={1}
                                max={10}
                                // BUG FIX: Use ?? instead of || so score=0 is shown correctly
                                value={formData.scores[alt.i]?.[cri.i] ?? ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) handleScoreChange(alt.i, cri.i, val);
                                  else if (e.target.value === '') {
                                    // Allow clearing — remove from scores
                                    setFormData((prev) => {
                                      const newScores = { ...prev.scores };
                                      if (newScores[alt.i]) {
                                        const altScores = { ...newScores[alt.i] };
                                        delete altScores[cri.i];
                                        newScores[alt.i] = altScores;
                                      }
                                      return { ...prev, scores: newScores };
                                    });
                                  }
                                }}
                                className="bg-background border-border text-center w-full"
                                required
                              />
                            </td>
                          ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary inline-block mr-2"></span>
              Please fill all cells before proceeding.
            </p>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Review Your Decision
              </h2>
              <p className="text-muted-foreground">
                Check everything looks correct before we analyze your decision.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-background rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Decision</h3>
                <p className="text-muted-foreground">{formData.decision}</p>
                {formData.context && (
                  <>
                    <h4 className="font-medium text-foreground mt-3 mb-1">Context</h4>
                    <p className="text-muted-foreground text-sm">{formData.context}</p>
                  </>
                )}
              </div>

              <div className="bg-background rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Criteria</h3>
                <ul className="space-y-2">
                  {formData.criteria
                    .filter((c) => c.name.trim().length > 0)
                    .map((criterion, index) => (
                      <li key={index} className="flex justify-between items-center text-muted-foreground">
                        <span>{criterion.name}</span>
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {criterion.weight}/10
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Alternatives</h3>
                <ul className="space-y-2">
                  {formData.alternatives
                    .filter((alt) => alt.trim().length > 0)
                    .map((alt, index) => (
                      <li key={index} className="flex items-center text-muted-foreground">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        {alt}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Analysis Loading */}
        {step === 6 && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Analyzing Your Decision
              </h2>
              <p className="text-muted-foreground">
                Our AI is evaluating your alternatives against your criteria...
              </p>
            </div>

            <div className="py-8">
              <div className="inline-block">
                <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This typically takes 10-30 seconds. Please wait...
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || step === 6}
          className="border-border"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-3">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground">
              Cancel
            </Button>
          </Link>

          {step < 5 && (
            <Button
              onClick={handleNext}
              disabled={!canProceedToStep(step + 1)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Next
              <span className="ml-2">→</span>
            </Button>
          )}

          {step === 5 && (
            <Button
              onClick={handleAnalyze}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Analyzing...' : 'Analyze'}
              <span className="ml-2">→</span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
