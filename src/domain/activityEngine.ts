export interface ComparisonResult {
  comparisonKey: string;
  preMean: number;
  postMean: number;
  difference: number;
  percentageChange: number;
  count: number;
}

export interface AnswerItem {
  userId?: string;
  value: number | string;
}

export class ActivityEngine {
  /**
   * AC-010: Pre/Post Assessment Comparison.
   * Compares baseline (pre) vs post-workshop assessments based on matching comparison keys.
   */
  static comparePrePost(
    preAnswers: AnswerItem[],
    postAnswers: AnswerItem[],
    comparisonKey: string
  ): ComparisonResult {
    const preNums = preAnswers.map(a => Number(a.value)).filter(n => !isNaN(n));
    const postNums = postAnswers.map(a => Number(a.value)).filter(n => !isNaN(n));

    const preMean = preNums.length > 0 ? preNums.reduce((a, b) => a + b, 0) / preNums.length : 0;
    const postMean = postNums.length > 0 ? postNums.reduce((a, b) => a + b, 0) / postNums.length : 0;
    const diff = postMean - preMean;
    const pct = preMean > 0 ? (diff / preMean) * 100 : 0;

    return {
      comparisonKey,
      preMean: Number(preMean.toFixed(2)),
      postMean: Number(postMean.toFixed(2)),
      difference: Number(diff.toFixed(2)),
      percentageChange: Number(pct.toFixed(1)),
      count: Math.min(preNums.length, postNums.length)
    };
  }

  /**
   * AC-009: Privacy and Anonymity Threshold.
   * Ensures responses from groups smaller than threshold are suppressed to prevent de-anonymization.
   */
  static filterByPrivacyThreshold<T>(items: T[], minThreshold = 3): T[] | null {
    if (items.length < minThreshold) {
      return null; // Suppress aggregation if sample size is below anonymity threshold
    }
    return items;
  }
}
