import { describe, expect, it } from 'vitest'
import { adaptSavedPlanApiListResponse, savedPlansApiEndpoints } from './savedPlansApi'

describe('saved plans API adapter', () => {
  it('uses the saved_plans is_liked field as the only like source', () => {
    const result = adaptSavedPlanApiListResponse({
      items: [
        {
          itineraryId: 'plan-1',
          userId: 'user-1',
          title: '강릉 1박 2일',
          destination: { nameKo: '강릉' },
          durationLabel: '1박 2일',
          themes: ['바다'],
          summary: '해안 산책 중심 일정',
          itinerary: {
            days: [
              {
                day: 1,
                title: '1일차',
                summary: '도착과 산책',
                stops: [
                  {
                    time: '아침',
                    move: '도보 10분',
                    title: '안목해변',
                    body: '바다를 먼저 봅니다.',
                    reason: '바다 테마와 맞습니다.',
                  },
                ],
              },
            ],
          },
          is_liked: 1,
          savedAt: '2026-06-11T00:00:00Z',
        },
        {
          itineraryId: 'plan-2',
          userId: 'user-1',
          title: '경주 당일치기',
          destination: { nameKo: '경주' },
          durationLabel: '당일치기',
          themes: ['전통'],
          itinerary: {
            days: [
              {
                day: 1,
                title: '1일차',
                summary: '전통 산책',
                stops: [
                  {
                    time: '점심',
                    move: '도보 8분',
                    title: '황리단길',
                    body: '느린 산책을 합니다.',
                    reason: '전통 테마와 맞습니다.',
                  },
                ],
              },
            ],
          },
          isLiked: false,
          savedAt: '2026-06-11T00:00:00Z',
        },
      ],
    })

    expect(result.savedPlans).toHaveLength(2)
    expect(result.savedPlans[0]).toMatchObject({
      id: 'plan-1',
      ownerId: 'user-1',
      cityPair: '강릉',
      themeTag: '바다',
      isLiked: true,
    })
    expect(result.savedPlans[1]).toMatchObject({
      id: 'plan-2',
      cityPair: '경주',
      themeTag: '전통',
      isLiked: false,
    })
    expect(result.likes).toEqual({ 'plan-1': 'like' })
  })

  it('keeps endpoint names aligned with the current saved_plans API boundary', () => {
    expect(savedPlansApiEndpoints.list).toBe('/api/v1/me/itineraries')
    expect(savedPlansApiEndpoints.create).toBe('/api/v1/me/itineraries')
    expect(savedPlansApiEndpoints.detail('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa')
    expect(savedPlansApiEndpoints.delete('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa')
    expect(savedPlansApiEndpoints.like('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa/reactions/like')
    expect(savedPlansApiEndpoints.unlike('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa/reactions/like')
  })
})
