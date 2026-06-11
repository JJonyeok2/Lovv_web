import { describe, expect, it } from 'vitest'
import {
  adaptPreferenceApiRecord,
  preferencesApiEndpoints,
  serializePreferenceProfileForApi,
} from './preferencesApi'

describe('preferences API adapter', () => {
  it('adapts the backend preference shape into the frontend profile model', () => {
    expect(
      adaptPreferenceApiRecord({
        selected_theme_ids: ['sea_coast', 'food_local', 'sea_coast', 'unknown'],
        source: 'preference_edit',
        updated_at: '2026-06-11T00:00:00.000Z',
      }),
    ).toEqual({
      version: 2,
      selectedThemeIds: ['sea_coast', 'food_local'],
      source: 'preference_edit',
      updatedAt: '2026-06-11T00:00:00.000Z',
    })
  })

  it('keeps preference endpoint names aligned with the current API boundary', () => {
    expect(preferencesApiEndpoints.get).toBe('/api/v1/me/preferences')
    expect(preferencesApiEndpoints.update).toBe('/api/v1/me/preferences')
  })

  it('serializes only DB-backed preference choices for future PUT calls', () => {
    expect(
      serializePreferenceProfileForApi({
        version: 2,
        selectedThemeIds: ['history_tradition', 'art_emotion'],
        source: 'preference_edit',
        updatedAt: '2026-06-11T00:00:00.000Z',
      }),
    ).toEqual({
      selectedThemeIds: ['history_tradition', 'art_emotion'],
    })
  })

  it('ignores unusable preference records', () => {
    expect(adaptPreferenceApiRecord({ selected_theme_ids: ['not-a-theme'] })).toBeNull()
  })
})
