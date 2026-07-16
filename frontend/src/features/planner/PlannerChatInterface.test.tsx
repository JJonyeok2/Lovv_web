import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlannerChatInterface } from './PlannerChatInterface'
import type { ChatMessage, MockConditionExtraction, PlanDraft } from '../../shared/types/app'

const basePlanDraft: PlanDraft = {
  durationLabel: '1박 2일',
  intensityLabel: '느긋한 일정',
  festivalThemeLabel: '축제 미정',
  summary: '테스트 일정',
  dayCount: 2,
  stops: [],
  days: [],
}

const renderChat = (
  overrides: Partial<React.ComponentProps<typeof PlannerChatInterface>> = {},
) => {
  const props: React.ComponentProps<typeof PlannerChatInterface> = {
    chatScrollRef: { current: null },
    chatMessages: [],
    shouldShowFestivalPrompt: false,
    festivalThemeChoice: 'undecided',
    selectedDurationLabel: null,
    submitChatMessage: vi.fn(),
    submitGuidedPlannerChoices: vi.fn(),
    shouldShowDurationPrompt: false,
    shouldShowTravelMonthPrompt: false,
    selectedTravelMonth: null,
    isPlannerReady: false,
    planDraft: basePlanDraft,
    plannerConditionExtraction: null as MockConditionExtraction | null,
    chatInput: '',
    setChatInput: vi.fn(),
    hasGuidedPlannerChoices: true,
    canSubmitChatInput: false,
    submitChatForm: vi.fn(),
    isPlannerLoading: false,
    shouldAskFestivalTheme: false,
    onSelectClarificationOption: vi.fn(),
    startNewRecommendation: vi.fn(),
    ...overrides,
  }

  render(<PlannerChatInterface {...props} />)

  return props
}

afterEach(() => {
  vi.useRealTimers()
})

describe('PlannerChatInterface clarification options', () => {
  it('continues guided planning without a festival choice when the destination has no festival prompt', () => {
    const submitGuidedPlannerChoices = vi.fn()

    renderChat({
      shouldAskFestivalTheme: false,
      shouldShowDurationPrompt: true,
      hasGuidedPlannerChoices: false,
      submitGuidedPlannerChoices,
    })

    expect(screen.getByText('여행 기간과 희망 월을 한 번에 골라주세요.')).toBeInTheDocument()
    expect(screen.queryByText('축제 포함 여부')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))
    expect(submitGuidedPlannerChoices).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    expect(submitGuidedPlannerChoices).toHaveBeenCalledWith({
      durationLabel: '1박 2일',
      travelMonth: 6,
      festivalChoice: 'exclude',
    })
  })

  it('renders server clarification options as buttons and returns the selected option id', async () => {
    const onSelectClarificationOption = vi.fn()
    const chatMessages: ChatMessage[] = [
      {
        id: 'assistant-clarify-1',
        role: 'assistant',
        content: '축제 포함 여부를 골라주세요.',
        clarification: {
          threadId: 'thread-001',
          recommendationId: 'rec-001',
          reasonCode: 'FESTIVAL_CHOICE_REQUIRED',
          prompt: '축제를 일정에 포함할까요?',
          options: [
            {
              optionId: 'continue_without_festival',
              label: '축제 없이 계속하기',
              helperText: '동선을 먼저 안정적으로 구성합니다.',
              apply: { includeFestivals: false },
              then: 'rerun_discovery',
            },
            {
              optionId: 'include_festival',
              label: '축제 포함하기',
            },
          ],
        },
      },
    ]

    renderChat({ chatMessages, onSelectClarificationOption })

    expect(screen.getByText('축제를 일정에 포함할까요?')).toBeInTheDocument()
    expect(screen.getByText('동선을 먼저 안정적으로 구성합니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /축제 없이 계속하기/ }))

    expect(onSelectClarificationOption).toHaveBeenCalledWith(
      'assistant-clarify-1',
      'continue_without_festival',
    )
  })

  it('offers a new generation action without presenting it as a retry', () => {
    const startNewRecommendation = vi.fn()

    renderChat({
      startNewRecommendation,
      chatMessages: [
        {
          id: 'assistant-new-generation-1',
          role: 'assistant',
          content: '일정 생성 결과를 확인하지 못했어요.',
          canStartNewRecommendation: true,
          newRecommendationAvailableAt: 0,
        },
      ],
    })

    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '새 일정 생성' }))

    expect(startNewRecommendation).toHaveBeenCalledTimes(1)
  })

  it('announces and enforces the 504 cooldown before enabling a new generation', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T00:00:00Z'))
    const startNewRecommendation = vi.fn()

    renderChat({
      startNewRecommendation,
      chatMessages: [
        {
          id: 'assistant-timeout-1',
          role: 'assistant',
          content: '일정 생성 결과를 확인하지 못했어요.',
          canStartNewRecommendation: true,
          newRecommendationAvailableAt: Date.now() + 60_000,
        },
      ],
    })

    const coolingButton = screen.getByRole('button', { name: '새 일정 생성 (60초)' })
    expect(coolingButton).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('60초 후 새 일정 생성 버튼을 사용할 수 있습니다.')

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    const enabledButton = screen.getByRole('button', { name: '새 일정 생성' })
    expect(enabledButton).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('새 일정 생성 버튼을 사용할 수 있습니다.')
    fireEvent.click(enabledButton)
    expect(startNewRecommendation).toHaveBeenCalledTimes(1)
  })
})
