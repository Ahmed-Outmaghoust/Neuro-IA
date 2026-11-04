import { describe, expect, it } from 'vitest'
import {
  hasChosenImportance,
  hasRescuedNetwork,
  importanceScore,
  INITIAL_IMPORTANCE_CHALLENGE,
  INITIAL_RESCUE_CHALLENGE,
  resetImportanceChallenge,
  resetRescueChallenge,
  rescuePredictions,
} from './challenges'

describe('قواعد التحديات', () => {
  it('لا يكشف فوز تحدّي الأهمية إلا عندما يصل التوقّع إلى الهدف', () => {
    expect(importanceScore(INITIAL_IMPORTANCE_CHALLENGE)).toBeLessThan(0.7)
    expect(hasChosenImportance(INITIAL_IMPORTANCE_CHALLENGE)).toBe(false)
    expect(hasChosenImportance({ ...INITIAL_IMPORTANCE_CHALLENGE, weights: [1, 1, -1] })).toBe(true)
  })

  it('يفوز تحدّي الإنقاذ فقط إذا صحّ التوقّعان', () => {
    expect(hasRescuedNetwork(INITIAL_RESCUE_CHALLENGE)).toBe(false)
    expect(rescuePredictions(INITIAL_RESCUE_CHALLENGE)[0]).toBeLessThan(0.5)
    expect(hasRescuedNetwork({ ...INITIAL_RESCUE_CHALLENGE, weights: [1.5, -1.5], bias: 0 })).toBe(true)
  })

  it('يعيد كلّ لعبة إلى قيم بداية قابلة للتغيير دون تعديل الثوابت', () => {
    const importance = resetImportanceChallenge()
    importance.weights[0] = -7
    const rescue = resetRescueChallenge()
    rescue.weights[0] = 7

    expect(resetImportanceChallenge()).toEqual(INITIAL_IMPORTANCE_CHALLENGE)
    expect(resetRescueChallenge()).toEqual(INITIAL_RESCUE_CHALLENGE)
  })
})
