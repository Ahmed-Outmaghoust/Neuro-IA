import { describe, expect, it } from 'vitest'
import {
  classify,
  forward,
  INITIAL_NETWORK,
  measureModel,
  resetNetwork,
  runNeuron,
  sigmoid,
  TRAINING_EXAMPLES,
  trainEpoch,
  trainNetwork,
} from './network'

describe('حسابات العصبون والشبكة', () => {
  it('تحسب خرج عصبون من مدخلاته وأوزانه وانحيازه', () => {
    expect(runNeuron([1, 0], [2, -4], 0)).toBeCloseTo(sigmoid(2))
    expect(() => runNeuron([1], [1, 2])).toThrow(RangeError)
  })

  it('تمرّر القيم عبر طبقتين وتُخرج توقّعاً بين صفر وواحد', () => {
    const prediction = forward(INITIAL_NETWORK, [0.9, 0.25])
    expect(prediction.hidden).toHaveLength(2)
    expect(prediction.probability).toBeGreaterThanOrEqual(0)
    expect(prediction.probability).toBeLessThanOrEqual(1)
    expect(classify(INITIAL_NETWORK, [0.9, 0.25])).toBe(0)
  })

  it('تقيس عدد الأخطاء والدقة من أمثلة التصنيف الفعلية', () => {
    const metrics = measureModel(INITIAL_NETWORK, TRAINING_EXAMPLES)
    expect(metrics.mistakes).toBe(TRAINING_EXAMPLES.length)
    expect(metrics.accuracy).toBe(0)
    expect(metrics.averageLoss).toBeGreaterThan(0)
  })

  it('تعدّل المعاملات وتخفّض أخطاء مجموعة الأمثلة بعد التدريب', () => {
    const before = measureModel(INITIAL_NETWORK, TRAINING_EXAMPLES)
    const afterOneEpoch = trainEpoch(INITIAL_NETWORK, TRAINING_EXAMPLES, 0.35)
    const after = trainNetwork(INITIAL_NETWORK, TRAINING_EXAMPLES, 80, 0.35)
    const gameTraining = trainNetwork(INITIAL_NETWORK, TRAINING_EXAMPLES, 120, 0.45)

    expect(afterOneEpoch.outputWeights).not.toEqual(INITIAL_NETWORK.outputWeights)
    expect(after.history.at(-1)!.mistakes).toBeLessThan(before.mistakes)
    expect(after.history.at(-1)!.averageLoss).toBeLessThan(before.averageLoss)
    expect(gameTraining.history.at(-1)!.mistakes).toBeLessThanOrEqual(1)
  })

  it('يعيد نسخة مستقلة من المعاملات الابتدائية', () => {
    const reset = resetNetwork()
    reset.inputWeights[0][0] = 99
    expect(INITIAL_NETWORK.inputWeights[0][0]).toBe(3)
    expect(resetNetwork()).toEqual(INITIAL_NETWORK)
  })
})
