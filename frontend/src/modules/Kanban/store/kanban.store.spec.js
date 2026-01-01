
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKanbanStore } from './kanban.store'
import { apolloClient } from '@/apollo'

vi.mock('@/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

describe('Kanban Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('addReaction calls ADD_REACTION mutation', async () => {
    const store = useKanbanStore()
    const commentId = 'comment-1'
    const emoji = '👍'
    const mockResponse = {
        data: {
            addReaction: {
                id: 'reaction-1',
                emoji,
                user: { id: 'u1' }
            }
        }
    }

    apolloClient.mutate.mockResolvedValue(mockResponse)

    const result = await store.addReaction(commentId, emoji)

    expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
        variables: { commentId, emoji }
    }))
    expect(result).toEqual(mockResponse.data.addReaction)
  })
})
