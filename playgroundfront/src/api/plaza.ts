import { post } from './client'
import type { PlazaStateResponse } from './types'

/** 놀이터 입장 (P-1). 정원이 차 있으면 PLAZA_FULL 로 거절한다 */
export const enterPlaza = () => post<PlazaStateResponse>('/plaza/enter')
