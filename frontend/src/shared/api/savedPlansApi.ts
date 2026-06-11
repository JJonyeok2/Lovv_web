import type { PlanDay, PlanStop, SavedPlan, SavedPlanLike } from '../types/app'

export const savedPlansApiEndpoints = {
  list: '/api/v1/me/itineraries',
  create: '/api/v1/me/itineraries',
  detail: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}`,
  delete: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}`,
  like: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}/reactions/like`,
  unlike: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}/reactions/like`,
} as const

export type SavedPlanApiRecord = {
  id?: string
  itineraryId?: string
  itinerary_id?: string
  ownerId?: string
  userId?: string
  user_id?: string
  title?: string
  cityPair?: string
  city_pair?: string
  destination?: {
    name?: string
    nameKo?: string
    destinationName?: string
    cityName?: string
  }
  themeTag?: string
  theme_tag?: string
  themeLabels?: string[]
  theme_labels?: string[]
  themes?: string[]
  conditionSummary?: string
  condition_summary?: string
  durationLabel?: string
  duration_label?: string
  festivalThemeLabel?: string
  festival_theme_label?: string
  intensityLabel?: string
  intensity_label?: string
  summary?: string
  itinerary?: {
    days?: PlanDay[]
  }
  days?: PlanDay[]
  stops?: PlanStop[]
  isLiked?: boolean
  is_liked?: boolean | 0 | 1
  createdAt?: string
  created_at?: string
  savedAt?: string
  saved_at?: string
}

export type SavedPlanApiListResponse = {
  data?: SavedPlanApiRecord[]
  items?: SavedPlanApiRecord[]
  savedPlans?: SavedPlanApiRecord[]
  page?: {
    page?: number
    pageSize?: number
    total?: number
    hasNext?: boolean
  }
}

export type SavedPlanApiAdapterResult = {
  savedPlans: SavedPlan[]
  likes: Record<string, Exclude<SavedPlanLike, null>>
}

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

const readStringArray = (...values: unknown[]) => {
  const value = values.find(Array.isArray)

  return value ? value.filter((item): item is string => typeof item === 'string') : []
}

const readIsLiked = (record: SavedPlanApiRecord) => {
  if (typeof record.isLiked === 'boolean') {
    return record.isLiked
  }

  if (typeof record.is_liked === 'boolean') {
    return record.is_liked
  }

  return record.is_liked === 1
}

export const adaptSavedPlanApiRecord = (record: SavedPlanApiRecord): SavedPlan | null => {
  const id = readString(record.id, record.itineraryId, record.itinerary_id)
  const title = readString(record.title)
  const durationLabel = readString(record.durationLabel, record.duration_label)
  const days = Array.isArray(record.days) ? record.days : Array.isArray(record.itinerary?.days) ? record.itinerary.days : undefined
  const stops = Array.isArray(record.stops) ? record.stops : days?.flatMap((day) => day.stops) ?? []

  if (!id || !title || !durationLabel || stops.length === 0) {
    return null
  }

  const themeLabels = readStringArray(record.themeLabels, record.theme_labels, record.themes)
  const destinationName = readString(
    record.cityPair,
    record.city_pair,
    record.destination?.nameKo,
    record.destination?.destinationName,
    record.destination?.cityName,
    record.destination?.name,
  )

  return {
    id,
    ownerId: readString(record.ownerId, record.userId, record.user_id),
    title,
    cityPair: destinationName,
    themeTag: readString(record.themeTag, record.theme_tag, themeLabels[0]),
    themeLabels,
    conditionSummary: readString(record.conditionSummary, record.condition_summary),
    durationLabel,
    festivalThemeLabel: readString(record.festivalThemeLabel, record.festival_theme_label),
    intensityLabel: readString(record.intensityLabel, record.intensity_label),
    summary: readString(record.summary),
    days,
    stops,
    isLiked: readIsLiked(record),
    createdAt: readString(record.createdAt, record.created_at),
    savedAt: readString(record.savedAt, record.saved_at),
  }
}

export const adaptSavedPlanApiListResponse = (
  response: SavedPlanApiListResponse,
): SavedPlanApiAdapterResult => {
  const records = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.items)
      ? response.items
      : response.savedPlans ?? []
  const savedPlans = records.map(adaptSavedPlanApiRecord).filter((plan): plan is SavedPlan => Boolean(plan))
  const likes = savedPlans.reduce<Record<string, Exclude<SavedPlanLike, null>>>((likeMap, plan) => {
    if (plan.isLiked) {
      likeMap[plan.id] = 'like'
    }

    return likeMap
  }, {})

  return { savedPlans, likes }
}
