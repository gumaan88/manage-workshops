import { describe, it, expect } from 'vitest';
import { ActivityEngine } from '../../src/domain/activityEngine';

describe('AC-010: Pre/Post Evaluation & ActivityEngine', () => {
  it('correctly calculates pre/post mean, difference, and percentage growth', () => {
    const preAnswers = [
      { userId: 'u1', value: 2 },
      { userId: 'u2', value: 3 },
      { userId: 'u3', value: 1 },
      { userId: 'u4', value: 2 },
    ];

    const postAnswers = [
      { userId: 'u1', value: 4 },
      { userId: 'u2', value: 5 },
      { userId: 'u3', value: 4 },
      { userId: 'u4', value: 5 },
    ];

    const result = ActivityEngine.comparePrePost(preAnswers, postAnswers, 'comp_awareness');

    // Pre mean = (2+3+1+2) / 4 = 2.0
    // Post mean = (4+5+4+5) / 4 = 4.5
    // Difference = +2.5
    // Percentage change = (2.5 / 2.0) * 100 = 125.0%
    expect(result.preMean).toBe(2.0);
    expect(result.postMean).toBe(4.5);
    expect(result.difference).toBe(2.5);
    expect(result.percentageChange).toBe(125.0);
    expect(result.count).toBe(4);
  });

  it('handles edge case when preMean is zero gracefully', () => {
    const preAnswers = [{ value: 0 }];
    const postAnswers = [{ value: 3 }];

    const result = ActivityEngine.comparePrePost(preAnswers, postAnswers, 'comp_new_skill');
    expect(result.difference).toBe(3);
    expect(result.percentageChange).toBe(0);
  });

  it('AC-009: suppresses results when count is below privacy threshold', () => {
    const smallGroup = [{ id: 1 }, { id: 2 }];
    expect(ActivityEngine.filterByPrivacyThreshold(smallGroup, 3)).toBeNull();

    const validGroup = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(ActivityEngine.filterByPrivacyThreshold(validGroup, 3)).not.toBeNull();
  });
});
