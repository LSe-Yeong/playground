import { get } from './client'
import type { GameListResponse } from './types'

export const fetchGames = () => get<GameListResponse>('/games')
