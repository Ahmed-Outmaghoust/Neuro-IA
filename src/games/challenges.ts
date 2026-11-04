import { runNeuron, type Pair } from '../neural/network'

export type SliderChallenge = {
  inputs: number[]
  weights: number[]
  bias: number
}

export const INITIAL_IMPORTANCE_CHALLENGE: SliderChallenge = {
  inputs: [0.85, 0.7, 0.35],
  weights: [0.55, 0.55, -0.75],
  bias: -0.2,
}

export const RESCUE_EXAMPLES: readonly { inputs: Pair; label: 0 | 1 }[] = [
  { inputs: [0.9, 0.15], label: 1 },
  { inputs: [0.15, 0.9], label: 0 },
]

export const INITIAL_RESCUE_CHALLENGE: SliderChallenge = {
  inputs: [0.9, 0.15],
  weights: [-1.5, 1.5],
  bias: 0.2,
}

export function importanceScore(challenge: SliderChallenge): number {
  return runNeuron(challenge.inputs, challenge.weights, challenge.bias)
}

export function hasChosenImportance(challenge: SliderChallenge): boolean {
  return importanceScore(challenge) >= 0.7
}

export function resetImportanceChallenge(): SliderChallenge {
  return {
    inputs: [...INITIAL_IMPORTANCE_CHALLENGE.inputs],
    weights: [...INITIAL_IMPORTANCE_CHALLENGE.weights],
    bias: INITIAL_IMPORTANCE_CHALLENGE.bias,
  }
}

export function rescuePredictions(challenge: SliderChallenge): [number, number] {
  const [positive, negative] = RESCUE_EXAMPLES
  return [
    runNeuron(positive!.inputs, challenge.weights, challenge.bias),
    runNeuron(negative!.inputs, challenge.weights, challenge.bias),
  ]
}

export function hasRescuedNetwork(challenge: SliderChallenge): boolean {
  const [positive, negative] = rescuePredictions(challenge)
  return positive >= 0.7 && negative <= 0.3
}

export function resetRescueChallenge(): SliderChallenge {
  return {
    inputs: [...INITIAL_RESCUE_CHALLENGE.inputs],
    weights: [...INITIAL_RESCUE_CHALLENGE.weights],
    bias: INITIAL_RESCUE_CHALLENGE.bias,
  }
}
