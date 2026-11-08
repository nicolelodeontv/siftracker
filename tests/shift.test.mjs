import test from 'node:test'
import assert from 'node:assert/strict'
import { BREAK_SECONDS, calculateShift, calculateWorkloads } from '../lib/shift.ts'
import { DEFAULT_RATES, DEFAULT_WORKLOADS, validateRates } from '../lib/workloads.ts'

const hms = (h, m = 0, s = 0) => h * 3600 + m * 60 + s
const at = (iso) => Date.parse(iso)

test('totals workload time from quantities and expressions', () => {
  const values = { teamEdit: '2', indiClip: '5+5', indiEdit: '', indiBuild: '3', lateOrders: '' }
  const { totalSeconds, totalUnits } = calculateWorkloads(DEFAULT_WORKLOADS, values)
  // 2*15 + 10*5 + 3*4 = 92 minutes
  assert.equal(totalSeconds, 92 * 60)
  assert.equal(totalUnits, 15)
})

test('ignores invalid and negative inputs in totals', () => {
  const { totalSeconds, totalUnits } = calculateWorkloads(DEFAULT_WORKLOADS, {
    teamEdit: '-4', indiClip: '5+', indiEdit: 'abc', indiBuild: '', lateOrders: '',
  })
  assert.equal(totalSeconds, 0)
  assert.equal(totalUnits, 0)
})

test('clock out is clock in plus work time plus the fixed break', () => {
  const shift = calculateShift('08:00:00', 4 * 3600, 20, hms(9), undefined, at('2026-11-09T01:00:00Z'))
  assert.equal(shift.shiftSeconds, 4 * 3600 + BREAK_SECONDS)
  assert.equal(shift.estimatedClockOutSeconds, hms(13))
  assert.equal(shift.shiftStatus, 'IN PROGRESS')
})

test('no clock out or shift without workload or clock in', () => {
  assert.equal(calculateShift('08:00:00', 0, 0, hms(9)).estimatedClockOutSeconds, null)
  assert.equal(calculateShift('08:00:00', 0, 0, hms(9)).shiftStatus, 'NOT STARTED')
  assert.equal(calculateShift('', 3600, 5, hms(9)).estimatedClockOutSeconds, null)
})

test('shift completes once elapsed time reaches the shift length', () => {
  // 09:00 PHT is 01:00Z. Clock in 08:00 PHT with 1h work + 1h break => done at 10:00 PHT.
  const during = calculateShift('08:00:00', 3600, 5, hms(9), undefined, at('2026-11-09T01:00:00Z'))
  assert.equal(during.shiftComplete, false)
  assert.equal(during.timeLeftSeconds, 3600)
  const after = calculateShift('08:00:00', 3600, 5, hms(10), undefined, at('2026-11-09T02:00:00Z'))
  assert.equal(after.shiftComplete, true)
  assert.equal(after.timeLeftSeconds, 0)
  assert.equal(after.shiftStatus, 'SHIFT COMPLETE')
})

test('overnight shifts count elapsed time from the previous day', () => {
  // Clock in 22:00 PHT, now 01:00 PHT next day (17:00Z) => 3 hours elapsed.
  const shift = calculateShift('22:00:00', 8 * 3600, 30, hms(1), undefined, at('2026-11-08T17:00:00Z'))
  assert.equal(shift.elapsedShiftSeconds, 3 * 3600)
})

test('validates rates strictly', () => {
  assert.deepEqual(validateRates({ ...DEFAULT_RATES }), DEFAULT_RATES)
  assert.equal(validateRates(null), null)
  assert.equal(validateRates([]), null)
  assert.equal(validateRates({ ...DEFAULT_RATES, teamEdit: 0 }), null)
  assert.equal(validateRates({ ...DEFAULT_RATES, teamEdit: 241 }), null)
  assert.equal(validateRates({ ...DEFAULT_RATES, teamEdit: '15' }), null)
  assert.equal(validateRates({ ...DEFAULT_RATES, teamEdit: Number.NaN }), null)
  const { teamEdit, ...missing } = DEFAULT_RATES
  assert.equal(teamEdit, 15)
  assert.equal(validateRates(missing), null)
  assert.equal(validateRates({ ...DEFAULT_RATES, teamEdit: 14.6 }).teamEdit, 15)
})
