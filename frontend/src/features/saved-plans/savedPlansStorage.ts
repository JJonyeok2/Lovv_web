import type { SavedPlanLike, SavedPlan } from '../../shared/types/app'

export const savedPlansStorageKey = 'lovv.savedPlans'
export const likedPlanIdsStorageKey = 'lovv.likedPlanIds'
export const savedPlanLikesStorageKey = 'lovv.savedPlanLikes'

export type SavedPlanLikeMap = Record<string, Exclude<SavedPlanLike, null>>

export const getNextSavedPlanLike = (
  currentLike: SavedPlanLike,
  clickedLike: Exclude<SavedPlanLike, null>,
): SavedPlanLike => (currentLike === clickedLike ? null : clickedLike)

export const readStoredSavedPlans = (): SavedPlan[] => {
  try {
    const rawPlans = localStorage.getItem(savedPlansStorageKey)

    if (!rawPlans) {
      return []
    }

    const parsedPlans = JSON.parse(rawPlans)

    if (!Array.isArray(parsedPlans)) {
      return []
    }

    return parsedPlans.filter(
      (plan): plan is SavedPlan =>
        typeof plan?.id === 'string' &&
        typeof plan?.ownerId === 'string' &&
        typeof plan?.title === 'string' &&
        typeof plan?.cityPair === 'string' &&
        typeof plan?.durationLabel === 'string' &&
        (Array.isArray(plan?.days) || Array.isArray(plan?.stops)),
    )
  } catch {
    return []
  }
}

export const writeStoredSavedPlans = (plans: SavedPlan[]) => {
  localStorage.setItem(savedPlansStorageKey, JSON.stringify(plans))
}

export const readStoredLikedPlanIds = (): string[] => {
  try {
    const rawPlanIds = localStorage.getItem(likedPlanIdsStorageKey)

    if (!rawPlanIds) {
      return []
    }

    const parsedPlanIds = JSON.parse(rawPlanIds)

    return Array.isArray(parsedPlanIds)
      ? parsedPlanIds.filter((planId): planId is string => typeof planId === 'string')
      : []
  } catch {
    return []
  }
}

export const readStoredSavedPlanLikes = (): SavedPlanLikeMap => {
  const likes: SavedPlanLikeMap = {}

  try {
    const rawLikes = localStorage.getItem(savedPlanLikesStorageKey)

    if (rawLikes) {
      const parsedLikes = JSON.parse(rawLikes)

      if (parsedLikes && typeof parsedLikes === 'object' && !Array.isArray(parsedLikes)) {
        Object.entries(parsedLikes).forEach(([planId, like]) => {
          if (like === 'like') {
            likes[planId] = like
          }
        })
      }
    }
  } catch {
    // Keep the mock adapter resilient to malformed local data.
  }

  readStoredLikedPlanIds().forEach((planId) => {
    likes[planId] ??= 'like'
  })

  return likes
}

export const writeStoredSavedPlanLikes = (likes: SavedPlanLikeMap) => {
  localStorage.setItem(savedPlanLikesStorageKey, JSON.stringify(likes))
  localStorage.removeItem(likedPlanIdsStorageKey)
}

export const clearStoredSavedPlanState = () => {
  localStorage.removeItem(savedPlansStorageKey)
  localStorage.removeItem(savedPlanLikesStorageKey)
  localStorage.removeItem(likedPlanIdsStorageKey)
}
