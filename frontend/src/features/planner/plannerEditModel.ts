import type { PlanDay, PlanStop } from '../../shared/types/app'

export type PlannerEditIntent =
  | {
      type: 'replace_stop'
      day: number
      stopIndex: number
      timeLabel: PlanStop['time']
      rawText: string
    }
  | {
      type: 'replace_day_confirmation'
      day: number
      rawText: string
    }

const TIME_LABELS: PlanStop['time'][] = ['아침', '점심', '저녁']

const normalizeCommandText = (text: string) => text.trim().replace(/\s+/g, ' ')

export const parsePlannerEditCommand = (
  rawText: string,
  days: PlanDay[],
): PlannerEditIntent | null => {
  const text = normalizeCommandText(rawText)
  const compactText = text.replace(/\s+/g, '')
  const dayMatch = compactText.match(/([1-9]\d*)일차/)
  const day = dayMatch ? Number(dayMatch[1]) : null

  if (!day || !days.some((planDay) => planDay.day === day)) {
    return null
  }

  if (!/(바꿔|변경|교체|수정)/.test(compactText)) {
    return null
  }

  const matchedTimeLabel = TIME_LABELS.find((timeLabel) => compactText.includes(timeLabel))

  if (matchedTimeLabel) {
    const targetDay = days.find((planDay) => planDay.day === day)
    const stopIndex = targetDay?.stops.findIndex((stop) => stop.time === matchedTimeLabel) ?? -1

    if (stopIndex >= 0) {
      return {
        type: 'replace_stop',
        day,
        stopIndex,
        timeLabel: matchedTimeLabel,
        rawText: text,
      }
    }
  }

  if (/일정/.test(compactText)) {
    return {
      type: 'replace_day_confirmation',
      day,
      rawText: text,
    }
  }

  return null
}

const getReplacementTitle = (stop: PlanStop, destinationName: string) => {
  const destinationPrefix = destinationName.trim() || '해당 지역'
  const titleByTime: Record<PlanStop['time'], string> = {
    아침: `${destinationPrefix} 로컬 산책 코스`,
    점심: `${destinationPrefix} 골목 미식 코스`,
    저녁: `${destinationPrefix} 노을 전망 코스`,
  }

  return stop.title === titleByTime[stop.time]
    ? `${destinationPrefix} 숨은 장소 코스`
    : titleByTime[stop.time]
}

export const createStopReplacementCandidate = (
  day: PlanDay,
  stopIndex: number,
  destinationName: string,
): PlanStop => {
  const currentStop = day.stops[stopIndex]

  return {
    ...currentStop,
    title: getReplacementTitle(currentStop, destinationName),
    body: `${destinationName || '해당 지역'} 안에서 기존 시간대의 흐름은 유지하고 다른 장소 후보로 바꿉니다.`,
    reason: '전체 일정을 다시 만들지 않고 선택한 카드만 다른 지역 후보로 교체합니다.',
  }
}

export const createDayReplacementCandidate = (
  day: PlanDay,
  destinationName: string,
): PlanDay => ({
  ...day,
  title: `${day.day}일차 대체 일정 후보`,
  summary: `${destinationName || '해당 지역'} 안에서 같은 여행 조건을 유지한 대체 흐름입니다.`,
  stops: day.stops.map((_, index) => createStopReplacementCandidate(day, index, destinationName)),
})

export const applyPlanStopReplacement = (
  days: PlanDay[],
  dayNumber: number,
  stopIndex: number,
  replacement: PlanStop,
): PlanDay[] =>
  days.map((day) =>
    day.day === dayNumber
      ? {
          ...day,
          stops: day.stops.map((stop, index) => (index === stopIndex ? replacement : stop)),
        }
      : day,
  )

export const applyPlanDayReplacement = (
  days: PlanDay[],
  dayNumber: number,
  replacement: PlanDay,
): PlanDay[] => days.map((day) => (day.day === dayNumber ? replacement : day))
