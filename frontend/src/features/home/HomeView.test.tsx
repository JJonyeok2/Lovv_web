import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HomeView,
  MonthlyRecommendationMedia,
  monthlyRecommendationRotationIntervalMs,
} from './HomeView'
import { heroThemes, monthlyRecommendations } from './homeContent'

afterEach(() => {
  vi.useRealTimers()
})

describe('MonthlyRecommendationMedia', () => {
  it('shows a calm placeholder when the image is null', () => {
    render(<MonthlyRecommendationMedia image={null} altText="강릉 추천 소도시 이미지" />)

    expect(screen.getByText('이미지 준비 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows a calm placeholder when the image is blank', () => {
    render(<MonthlyRecommendationMedia image="   " altText="강릉 추천 소도시 이미지" />)

    expect(screen.getByText('이미지 준비 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('falls back to the placeholder when the image fails to load', () => {
    render(
      <MonthlyRecommendationMedia
        image="https://example.com/city.jpg"
        altText="강릉 추천 소도시 이미지"
      />,
    )

    const image = screen.getByRole('img', { name: '강릉 추천 소도시 이미지' })
    expect(image).toHaveAttribute('src', 'https://example.com/city.jpg')

    fireEvent.error(image)

    expect(screen.getByText('이미지 준비 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('HomeView monthly recommendations', () => {
  it('rotates each monthly recommendation into the featured card position', () => {
    vi.useFakeTimers()

    render(
      <HomeView
        currentHeroTheme={heroThemes[0]}
        selectedPreferenceProfile={{
          version: 2,
          selectedThemeIds: [monthlyRecommendations[0].preference.themeId],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        }}
        selectedThemeHashtags={[]}
        recommendationBasisHashtags={[]}
        openChat={vi.fn()}
        openMap={vi.fn()}
        onOpenMonthlyRecommendationDetail={vi.fn()}
        isQuickActionsOpen={false}
        onOpenChatFromQuickAction={vi.fn()}
        onScrollToTop={vi.fn()}
        onToggleQuickActions={vi.fn()}
      />,
    )

    const grid = screen.getByTestId('monthly-recommendation-grid')
    const getFeaturedRecommendationButton = () => within(grid).getAllByRole('button')[0]

    expect(getFeaturedRecommendationButton()).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[0].preference.cityPair} 이달 추천 상세 보기`,
    )

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationRotationIntervalMs)
    })

    expect(getFeaturedRecommendationButton()).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[1].preference.cityPair} 이달 추천 상세 보기`,
    )

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationRotationIntervalMs)
    })

    expect(getFeaturedRecommendationButton()).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[2].preference.cityPair} 이달 추천 상세 보기`,
    )
  })
})
