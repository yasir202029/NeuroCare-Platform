/**
 * Deterministic scoring helpers for validated screening questionnaires.
 *
 * Scores are decision support data only: they must be reviewed in clinical
 * context and must never be presented as a diagnosis to a patient.
 */
export type Likert0To3 = 0 | 1 | 2 | 3;
export type Likert0To4 = 0 | 1 | 2 | 3 | 4;

export type ScreeningResult = {
  total: number;
  maximum: number;
  interpretation: string;
  requiresClinicalReview: boolean;
};

const assertLength = (answers: readonly number[], expected: number, instrument: string) => {
  if (answers.length !== expected) {
    throw new RangeError(`${instrument} requires exactly ${expected} answers.`);
  }
};

const assertRange = (answers: readonly number[], minimum: number, maximum: number, instrument: string) => {
  if (answers.some((answer) => !Number.isInteger(answer) || answer < minimum || answer > maximum)) {
    throw new RangeError(`${instrument} answers must be whole numbers from ${minimum} to ${maximum}.`);
  }
};

const sum = (answers: readonly number[]) => answers.reduce((total, answer) => total + answer, 0);

/** PHQ-9 severity bands; a positive item 9 is always highlighted for urgent review. */
export function scorePhq9(answers: readonly Likert0To3[]): ScreeningResult & { selfHarmResponse: boolean } {
  assertLength(answers, 9, "PHQ-9");
  assertRange(answers, 0, 3, "PHQ-9");
  const total = sum(answers);
  const severity = total <= 4 ? "Minimal" : total <= 9 ? "Mild" : total <= 14 ? "Moderate" : total <= 19 ? "Moderately severe" : "Severe";
  const selfHarmResponse = answers[8] > 0;
  return {
    total,
    maximum: 27,
    interpretation: `${severity} depressive symptom score`,
    requiresClinicalReview: total >= 10 || selfHarmResponse,
    selfHarmResponse,
  };
}

/** GAD-7 severity bands. */
export function scoreGad7(answers: readonly Likert0To3[]): ScreeningResult {
  assertLength(answers, 7, "GAD-7");
  assertRange(answers, 0, 3, "GAD-7");
  const total = sum(answers);
  const severity = total <= 4 ? "Minimal" : total <= 9 ? "Mild" : total <= 14 ? "Moderate" : "Severe";
  return { total, maximum: 21, interpretation: `${severity} anxiety symptom score`, requiresClinicalReview: total >= 10 };
}

/** WSAS is scored 0–8 across five domains; 20+ indicates severe functional impairment. */
export function scoreWsas(answers: readonly number[]): ScreeningResult {
  assertLength(answers, 5, "WSAS");
  assertRange(answers, 0, 8, "WSAS");
  const total = sum(answers);
  const interpretation = total < 10 ? "Low functional impairment score" : total < 20 ? "Clinically significant functional impairment score" : "Severe functional impairment score";
  return { total, maximum: 40, interpretation, requiresClinicalReview: total >= 10 };
}

/** AQ-10 uses one point per keyed answer; a score of 6 or more warrants clinical consideration. */
export function scoreAq10(answers: readonly Likert0To3[]): ScreeningResult {
  assertLength(answers, 10, "AQ-10");
  assertRange(answers, 0, 3, "AQ-10");
  // The AQ-10's keyed response direction: agree for 1, 7, 8, 10; disagree for the remaining items.
  const agreeKeyed = new Set([0, 6, 7, 9]);
  const total = answers.reduce<number>((score, answer, index) => {
    const endorsed = agreeKeyed.has(index) ? answer >= 2 : answer <= 1;
    return score + Number(endorsed);
  }, 0);
  return {
    total,
    maximum: 10,
    interpretation: total >= 6 ? "Score meets the AQ-10 clinical consideration threshold" : "Score is below the AQ-10 clinical consideration threshold",
    requiresClinicalReview: total >= 6,
  };
}

/**
 * ASRS v1.1 Part A: response thresholds vary by item. Four or more shaded
 * responses is a positive screen, not a diagnosis.
 */
export function scoreAsrsPartA(answers: readonly Likert0To4[]): ScreeningResult & { endorsedItems: number } {
  assertLength(answers, 6, "ASRS Part A");
  assertRange(answers, 0, 4, "ASRS Part A");
  const thresholds = [2, 2, 2, 3, 3, 3];
  const endorsedItems = answers.reduce<number>((count, answer, index) => count + Number(answer >= thresholds[index]), 0);
  return {
    total: endorsedItems,
    maximum: 6,
    endorsedItems,
    interpretation: endorsedItems >= 4 ? "Positive ASRS Part A screen" : "ASRS Part A screen below the positive threshold",
    requiresClinicalReview: endorsedItems >= 4,
  };
}
