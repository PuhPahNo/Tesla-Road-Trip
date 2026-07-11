import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultPlannerConfig } from '../domain/config'
import { ConfigModal } from './ConfigModal'
import { BrandIsland } from './Chrome'
import { CustomRouteModal } from './CustomRouteModal'

afterEach(cleanup)

describe('planning modal responsibilities', () => {
  it('uses Charge Quest as the visible product brand', () => {
    render(
      <BrandIsland
        routeName="No route yet"
        contestLabel="2026 · Americas"
        onOpenRoutePicker={vi.fn()}
      />,
    )

    expect(screen.getByText('Charge Quest')).toBeTruthy()
    expect(screen.queryByText('Quest Planner')).toBeNull()
  })

  it('keeps global preferences in Config without a second must-see editor', () => {
    render(
      <ConfigModal
        config={defaultPlannerConfig}
        open
        isOptimizing={false}
        roadRoutingEnabled={false}
        onClose={vi.fn()}
        onChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Set defaults for every route')).toBeTruthy()
    expect(within(dialog).getByText('Vehicle & range')).toBeTruthy()
    expect(within(dialog).getByText('Driving preferences')).toBeTruthy()
    expect(within(dialog).queryByText('Must-visit targets')).toBeNull()
    expect(within(dialog).queryByLabelText('Search city or landmark targets')).toBeNull()
  })

  it('makes route-specific stops and inherited defaults explicit in the route builder', () => {
    render(
      <CustomRouteModal
        open
        isSaving={false}
        defaultTargetDays={60}
        preferences={defaultPlannerConfig}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Create custom route')).toBeTruthy()
    expect(within(dialog).getByText('Inherited travel preferences')).toBeTruthy()
    expect(within(dialog).getByText('Choose must-see stops')).toBeTruthy()
    expect(within(dialog).getByText('Daily maximum')).toBeTruthy()
    expect(within(dialog).getByText('6.5h')).toBeTruthy()
  })
})
