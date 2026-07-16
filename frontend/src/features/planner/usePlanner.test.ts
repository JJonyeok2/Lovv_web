import { describe, expect, it } from 'vitest'
import { RecommendationApiRequestError } from '../../shared/api/recommendationsApi'
import {
  createGeneratedPlanDestination,
  createRecommendationClarification,
  getRecommendationFailurePresentation,
  resolveSavedPlanDestination,
} from './usePlanner'

describe('generated plan destination metadata', () => {
  it('keeps replacement metadata atomic instead of mixing the previous city region', () => {
    const replacement = createGeneratedPlanDestination({
      destinationId: 'KR-Donghae',
      name: '동해시',
      country: 'KR',
      region: '강원',
    })

    expect(
      resolveSavedPlanDestination(replacement, {
        destinationId: 'KR-Asan',
        name: '아산',
        country: 'KR',
        region: '충남',
      }),
    ).toEqual({
      destinationId: 'KR-Donghae',
      name: '동해시',
      country: 'KR',
      region: '강원',
    })
  })

  it('does not copy the previous region when replacement metadata omits it', () => {
    const replacement = createGeneratedPlanDestination({
      destinationId: 'KR-Sokcho',
      name: '속초시',
      country: 'KR',
    })

    expect(
      resolveSavedPlanDestination(replacement, {
        destinationId: 'KR-Asan',
        name: '아산',
        country: 'KR',
        region: '충남',
      }),
    ).toEqual({
      destinationId: 'KR-Sokcho',
      name: '속초시',
      country: 'KR',
    })
  })
})

describe('createRecommendationClarification', () => {
  it('preserves V2 clarification option metadata for the chat UI', () => {
    const clarification = createRecommendationClarification({
      threadId: ' thread-1 ',
      recommendationId: 'recommendation-1',
      clarification: {
        prompt: '일정 수정 방향을 골라주세요.',
        options: [
          {
            optionId: ' nearby ',
            label: '가까운 장소',
            helperText: ' 숙소 주변 후보를 우선합니다. ',
            apply: { distanceKm: 5 },
            then: { entryType: 'modify' },
          },
        ],
      },
    })

    expect(clarification).toEqual({
      threadId: 'thread-1',
      recommendationId: 'recommendation-1',
      reasonCode: undefined,
      prompt: '일정 수정 방향을 골라주세요.',
      selectedOptionId: undefined,
      options: [
        {
          optionId: 'nearby',
          label: '가까운 장소',
          description: undefined,
          helperText: '숙소 주변 후보를 우선합니다.',
          apply: { distanceKm: 5 },
          then: { entryType: 'modify' },
        },
      ],
    })
  })
})

describe('getRecommendationFailurePresentation', () => {
  it.each([
    [502, '일정 생성 서비스 연결이 일시적으로 불안정합니다.', 5_000],
    [503, '현재 일정 생성 요청이 많거나 서비스를 사용할 수 없습니다.', 10_000],
    [504, '일정 생성 결과를 확인하지 못했어요.', 60_000],
  ])('maps status %s to a safe new-generation notice', (status, message, cooldownMs) => {
    const result = getRecommendationFailurePresentation(
      new RecommendationApiRequestError(status as number, 'AGENTCORE_UNAVAILABLE', 'failed'),
    )

    expect(result.message).toContain(message)
    expect(result.message).toContain('입력한 조건은 그대로 보관했어요.')
    expect(result.cooldownMs).toBe(cooldownMs)
  })
})
