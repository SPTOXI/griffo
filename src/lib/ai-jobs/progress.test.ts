import test from 'node:test'
import assert from 'node:assert/strict'
import { describeAiJobProgress, readSteps } from './progress'

test('sem etapas, progresso é zero', () => {
  const p = describeAiJobProgress({ status: 'running', stepsJson: null, totalSteps: 3 })
  assert.equal(p.completedSteps, 0)
  assert.equal(p.progress, 0)
})

test('progresso é a contagem real de etapas concluídas, não uma estimativa', () => {
  const p = describeAiJobProgress({
    status: 'running',
    stepsJson: JSON.stringify({ linkedin: {}, github: {} }),
    totalSteps: 3,
  })
  assert.equal(p.completedSteps, 2)
  assert.equal(p.progress, 67)
})

test('job completado é sempre 100%, mesmo com stepsJson desatualizado', () => {
  const p = describeAiJobProgress({
    status: 'completed',
    stepsJson: JSON.stringify({ attempt_1: {} }),
    totalSteps: 2,
  })
  assert.equal(p.progress, 100)
})

test('readSteps tolera JSON malformado ou não-objeto, sem lançar', () => {
  assert.deepEqual(readSteps(null), {})
  assert.deepEqual(readSteps('não é json'), {})
  assert.deepEqual(readSteps('["array", "não objeto"]'), {})
  assert.deepEqual(readSteps('{"a":1}'), { a: 1 })
})
