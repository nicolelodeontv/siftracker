import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateValue,
  formatDuration,
  formatMilitaryTime,
  getElapsedSeconds,
  isIncompleteExpression,
  timeToSeconds,
} from '../lib/calculator.ts'

test('calculates basic expressions', () => {
  assert.equal(calculateValue('5+5'), 10)
  assert.equal(calculateValue('10*3'), 30)
  assert.equal(calculateValue('(5+5)*2'), 20)
  assert.equal(calculateValue('10/2'), 5)
})

test('supports declared totals', () => {
  assert.equal(calculateValue('5+5=10'), 10)
  assert.equal(calculateValue('5+5=11'), null)
})

test('rejects invalid expressions', () => {
  assert.equal(calculateValue('5/0'), null)
  assert.equal(calculateValue('5+'), null)
  assert.equal(calculateValue('hello'), null)
})

test('identifies incomplete input', () => {
  assert.equal(isIncompleteExpression('5+'), true)
  assert.equal(isIncompleteExpression('(5+'), true)
  assert.equal(isIncompleteExpression('5+5'), false)
})

test('formats clock durations', () => {
  assert.equal(formatDuration(3723), '01:02:03')
  assert.equal(formatMilitaryTime(17 * 3600 + 24 * 60 + 36), '17:24:36')
  assert.equal(timeToSeconds('17:24:36'), 62676)
  assert.equal(timeToSeconds('25:00:00'), null)
})

test('wraps elapsed time across midnight', () => {
  assert.equal(getElapsedSeconds(23 * 3600 + 30 * 60, 30 * 60), 60 * 60)
})
