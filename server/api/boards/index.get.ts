import { requireUserId } from '../../utils/requireAuth'
import { dbListBoardsForUser } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boards = await dbListBoardsForUser(userId)
  return boards.map((b) => ({
    id: b.id,
    name: b.name,
    created_at: b.created_at,
    role: b.role
  }))
})
