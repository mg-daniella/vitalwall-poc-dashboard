import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCard  from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusDot   from '@/components/ui/StatusDot.vue'

// ── MetricCard ─────────────────────────────────────────────────────────────

describe('MetricCard', () => {
  it('muestra el valor cuando es un número', () => {
    const w = mount(MetricCard, { props: { label: 'Temperatura', value: 24.5, unit: '°C' } })
    expect(w.text()).toContain('24.5')
    expect(w.text()).toContain('°C')
  })

  it('muestra — cuando value es null', () => {
    const w = mount(MetricCard, { props: { label: 'Temperatura', value: null } })
    expect(w.text()).toContain('—')
  })

  it('muestra — cuando value es undefined', () => {
    const w = mount(MetricCard, { props: { label: 'Temperatura', value: undefined } })
    expect(w.text()).toContain('—')
    expect(w.text()).not.toContain('undefined')
  })

  it('muestra — cuando value es 0 no lo confunde con falsy', () => {
    const w = mount(MetricCard, { props: { label: 'Nivel', value: 0, unit: '%' } })
    expect(w.text()).toContain('0')
    expect(w.text()).not.toContain('—')
  })

  it('aplica clase CSS según el status', () => {
    const w = mount(MetricCard, { props: { label: 'T', value: 40, status: 'danger' } })
    expect(w.find('.metric-value').classes()).toContain('danger')
  })

  it('muestra badge cuando se proporciona', () => {
    const w = mount(MetricCard, { props: { label: 'T', value: 24, badge: 'Normal', status: 'ok' } })
    expect(w.text()).toContain('Normal')
    expect(w.find('.metric-badge').exists()).toBe(true)
  })

  it('no muestra badge cuando no se proporciona', () => {
    const w = mount(MetricCard, { props: { label: 'T', value: 24 } })
    expect(w.find('.metric-badge').exists()).toBe(false)
  })
})

// ── StatusDot ──────────────────────────────────────────────────────────────

describe('StatusDot', () => {
  it('renderiza con status ok', () => {
    const w = mount(StatusDot, { props: { status: 'ok' } })
    expect(w.find('.status-dot').exists()).toBe(true)
    expect(w.find('.status-dot').classes()).toContain('ok')
  })

  it('aplica clase danger', () => {
    const w = mount(StatusDot, { props: { status: 'danger' } })
    expect(w.find('.status-dot').classes()).toContain('danger')
  })

  it('aplica clase warning', () => {
    const w = mount(StatusDot, { props: { status: 'warning' } })
    expect(w.find('.status-dot').classes()).toContain('warning')
  })
})

// ── ProgressBar ────────────────────────────────────────────────────────────

describe('ProgressBar', () => {
  it('renderiza la barra de progreso', () => {
    const w = mount(ProgressBar, { props: { value: 75, color: 'var(--green)' } })
    expect(w.find('.progress-fill').exists()).toBe(true)
  })

  it('muestra rightLabel cuando se proporciona', () => {
    const w = mount(ProgressBar, { props: { value: 50, rightLabel: '50%' } })
    expect(w.text()).toContain('50%')
  })

  it('no supera el 100% visualmente', () => {
    const w = mount(ProgressBar, { props: { value: 150 } })
    const style = w.find('.progress-fill').attributes('style') || ''
    const match = style.match(/width:\s*([\d.]+)%/)
    if (match) expect(Number(match[1])).toBeLessThanOrEqual(100)
  })
})

// ── StatusBadge ────────────────────────────────────────────────────────────

describe('StatusBadge', () => {
  it('renderiza el texto del badge', () => {
    const w = mount(StatusBadge, { props: { label: 'Online', variant: 'green' } })
    expect(w.text()).toContain('Online')
  })

  it('aplica clase según variant', () => {
    const w = mount(StatusBadge, { props: { label: 'Aviso', variant: 'amber' } })
    expect(w.find('.status-badge').classes()).toContain('amber')
  })
})
