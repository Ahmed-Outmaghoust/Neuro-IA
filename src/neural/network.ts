export type Pair = readonly [number, number]
export type LabelledExample = {
  inputs: Pair
  label: 0 | 1
  name: string
}

export type NetworkParameters = {
  inputWeights: [[number, number], [number, number]]
  hiddenBias: [number, number]
  outputWeights: [number, number]
  outputBias: number
}

export type Prediction = {
  hidden: [number, number]
  logit: number
  probability: number
}

export type ModelMetrics = {
  mistakes: number
  accuracy: number
  averageLoss: number
}

export const TRAINING_EXAMPLES: LabelledExample[] = [
  { inputs: [0.9, 0.25], label: 1, name: 'قطة: أذنان مدببتان وخطم قصير' },
  { inputs: [0.75, 0.2], label: 1, name: 'قطة: أذنان مدببتان وخطم قصير' },
  { inputs: [0.85, 0.4], label: 1, name: 'قطة: أذنان مدببتان وخطم قصير' },
  { inputs: [0.65, 0.35], label: 1, name: 'قطة: أذنان مدببتان وخطم قصير' },
  { inputs: [0.25, 0.9], label: 0, name: 'كلب: أذنان أقلّ حدّة وخطم أطول' },
  { inputs: [0.35, 0.75], label: 0, name: 'كلب: أذنان أقلّ حدّة وخطم أطول' },
  { inputs: [0.2, 0.65], label: 0, name: 'كلب: أذنان أقلّ حدّة وخطم أطول' },
  { inputs: [0.4, 0.85], label: 0, name: 'كلب: أذنان أقلّ حدّة وخطم أطول' },
]

export const INITIAL_NETWORK: NetworkParameters = {
  inputWeights: [[3, -3], [-3, 3]],
  hiddenBias: [-0.2, 0.2],
  outputWeights: [-2, 2],
  outputBias: 0,
}

export function sigmoid(value: number): number {
  if (!Number.isFinite(value)) return value > 0 ? 1 : 0
  if (value >= 0) return 1 / (1 + Math.exp(-Math.min(value, 40)))
  const exp = Math.exp(Math.max(value, -40))
  return exp / (1 + exp)
}

export function runNeuron(inputs: readonly number[], weights: readonly number[], bias = 0): number {
  if (inputs.length !== weights.length) {
    throw new RangeError('يجب أن يطابق عدد الأوزان عدد المدخلات.')
  }
  const total = inputs.reduce((sum, input, index) => sum + input * weights[index]!, bias)
  return sigmoid(total)
}

export function forward(
  parameters: NetworkParameters,
  inputs: Pair,
): Prediction {
  const hidden: [number, number] = [0, 1].map((neuron) =>
    sigmoid(
      inputs[0] * parameters.inputWeights[0][neuron]! +
        inputs[1] * parameters.inputWeights[1][neuron]! +
        parameters.hiddenBias[neuron]!,
    ),
  ) as [number, number]
  const logit =
    hidden[0] * parameters.outputWeights[0] +
    hidden[1] * parameters.outputWeights[1] +
    parameters.outputBias

  return { hidden, logit, probability: sigmoid(logit) }
}

export function classify(parameters: NetworkParameters, inputs: Pair): 0 | 1 {
  return forward(parameters, inputs).probability >= 0.5 ? 1 : 0
}

export function measureModel(
  parameters: NetworkParameters,
  examples: readonly LabelledExample[],
): ModelMetrics {
  if (examples.length === 0) throw new RangeError('أضف مثالاً واحداً على الأقل لقياس الشبكة.')

  let mistakes = 0
  let totalLoss = 0
  for (const example of examples) {
    const probability = forward(parameters, example.inputs).probability
    if ((probability >= 0.5 ? 1 : 0) !== example.label) mistakes += 1
    const safe = Math.min(1 - 1e-7, Math.max(1e-7, probability))
    totalLoss += -(example.label * Math.log(safe) + (1 - example.label) * Math.log(1 - safe))
  }

  return {
    mistakes,
    accuracy: (examples.length - mistakes) / examples.length,
    averageLoss: totalLoss / examples.length,
  }
}

export function cloneParameters(parameters: NetworkParameters): NetworkParameters {
  return {
    inputWeights: [
      [...parameters.inputWeights[0]] as [number, number],
      [...parameters.inputWeights[1]] as [number, number],
    ],
    hiddenBias: [...parameters.hiddenBias],
    outputWeights: [...parameters.outputWeights],
    outputBias: parameters.outputBias,
  }
}

export function resetNetwork(): NetworkParameters {
  return cloneParameters(INITIAL_NETWORK)
}

export function trainEpoch(
  parameters: NetworkParameters,
  examples: readonly LabelledExample[],
  learningRate: number,
): NetworkParameters {
  if (examples.length === 0) throw new RangeError('لا يمكن التدريب بلا أمثلة.')
  if (!Number.isFinite(learningRate) || learningRate <= 0) {
    throw new RangeError('قوة التعلّم يجب أن تكون رقماً موجباً.')
  }

  const gradInput = [[0, 0], [0, 0]]
  const gradHiddenBias = [0, 0]
  const gradOutput = [0, 0]
  let gradOutputBias = 0

  for (const example of examples) {
    const prediction = forward(parameters, example.inputs)
    const outputDelta = prediction.probability - example.label
    gradOutputBias += outputDelta

    for (let hidden = 0; hidden < 2; hidden += 1) {
      gradOutput[hidden]! += outputDelta * prediction.hidden[hidden]!
      const hiddenDelta =
        outputDelta * parameters.outputWeights[hidden]! * prediction.hidden[hidden]! * (1 - prediction.hidden[hidden]!)
      gradHiddenBias[hidden]! += hiddenDelta
      gradInput[0]![hidden]! += hiddenDelta * example.inputs[0]
      gradInput[1]![hidden]! += hiddenDelta * example.inputs[1]
    }
  }

  const scale = learningRate / examples.length
  return {
    inputWeights: [
      [
        parameters.inputWeights[0][0] - scale * gradInput[0]![0]!,
        parameters.inputWeights[0][1] - scale * gradInput[0]![1]!,
      ],
      [
        parameters.inputWeights[1][0] - scale * gradInput[1]![0]!,
        parameters.inputWeights[1][1] - scale * gradInput[1]![1]!,
      ],
    ],
    hiddenBias: [
      parameters.hiddenBias[0] - scale * gradHiddenBias[0]!,
      parameters.hiddenBias[1] - scale * gradHiddenBias[1]!,
    ],
    outputWeights: [
      parameters.outputWeights[0] - scale * gradOutput[0]!,
      parameters.outputWeights[1] - scale * gradOutput[1]!,
    ],
    outputBias: parameters.outputBias - scale * gradOutputBias,
  }
}

export function trainNetwork(
  initial: NetworkParameters,
  examples: readonly LabelledExample[],
  epochs: number,
  learningRate: number,
): { parameters: NetworkParameters; history: ModelMetrics[] } {
  if (!Number.isInteger(epochs) || epochs < 1) throw new RangeError('عدد خطوات التدريب يجب أن يكون موجباً.')
  let parameters = cloneParameters(initial)
  const history: ModelMetrics[] = [measureModel(parameters, examples)]
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    parameters = trainEpoch(parameters, examples, learningRate)
    history.push(measureModel(parameters, examples))
  }
  return { parameters, history }
}
