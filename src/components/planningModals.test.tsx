import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultPlannerConfig } from '../domain/config'
import type { RoutePlan, SavedCustomRoute } from '../domain/types'
import { ConfigModal } from './ConfigModal'
import { BrandIsland } from './Chrome'
import { CustomRouteModal } from './CustomRouteModal'
import { RoutePicker } from './RoutePicker'

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
    const onChange = vi.fn()
    render(
      <ConfigModal
        config={defaultPlannerConfig}
        open
        isOptimizing={false}
        roadRoutingEnabled={false}
        onClose={vi.fn()}
        onChange={onChange}
        onApply={vi.fn()}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Set defaults for every route')).toBeTruthy()
    expect(within(dialog).getByText('Vehicle & range')).toBeTruthy()
    expect(within(dialog).getByText('Driving preferences')).toBeTruthy()
    expect(
      (within(dialog).getByLabelText('Generated trip start date') as HTMLInputElement)
        .value,
    ).toBe(defaultPlannerConfig.tripStartDate)
    const vehicleSelect = within(dialog).getByLabelText('Vehicle profile')
    fireEvent.change(vehicleSelect, { target: { value: 'model-s-awd' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleProfileId: 'model-s-awd',
        practicalRangeMiles: 305,
        manualPracticalRange: false,
      }),
    )
    expect(
      (within(dialog).getByLabelText('Practical range miles') as HTMLInputElement)
        .disabled,
    ).toBe(true)
    fireEvent.click(within(dialog).getByLabelText('Use manual practical range'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ manualPracticalRange: true }),
    )
    expect(within(dialog).queryByText('Must-visit targets')).toBeNull()
    expect(within(dialog).queryByLabelText('Search city or landmark targets')).toBeNull()
  })

  it('guides users through setup, destinations, and review while preserving route presets', () => {
    const onSave = vi.fn()
    render(
      <CustomRouteModal
        open
        isSaving={false}
        defaultTargetDays={60}
        defaultStartDate="2026-04-20"
        preferences={defaultPlannerConfig}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Create custom route')).toBeTruthy()
    expect(within(dialog).getByText('Start with the trip basics')).toBeTruthy()
    expect(within(dialog).getByText('Travel preferences')).toBeTruthy()
    expect(within(dialog).queryByText('Add the places that matter')).toBeNull()
    expect(within(dialog).getByText('Daily maximum')).toBeTruthy()
    expect(within(dialog).getByText('6.5h')).toBeTruthy()
    expect(
      (within(dialog).getByLabelText('Starting direction preference') as HTMLSelectElement)
        .value,
    ).toBe('seasonal')
    expect(
      (within(dialog).getByLabelText('Trip start date') as HTMLInputElement).value,
    ).toBe('2026-04-20')
    fireEvent.click(
      within(dialog).getByLabelText('Customize travel preferences for this route'),
    )
    expect(within(dialog).getByLabelText('Custom route vehicle profile')).toBeTruthy()
    expect(within(dialog).getByLabelText('Custom route trip pace')).toBeTruthy()
    expect(within(dialog).getByLabelText('Custom route maximum drive hours')).toBeTruthy()
    expect(within(dialog).getByLabelText('Custom route practical range miles')).toBeTruthy()
    expect(within(dialog).getByText(/Earth Day 2026 · day 3/)).toBeTruthy()

    fireEvent.change(within(dialog).getByLabelText('Route name'), {
      target: { value: 'Badge Run' },
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Continue to destinations' }),
    )
    expect(within(dialog).getByText('Add the places that matter')).toBeTruthy()
    expect(within(dialog).queryByText('Travel preferences')).toBeNull()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back' }))
    expect(
      (within(dialog).getByLabelText('Route name') as HTMLInputElement).value,
    ).toBe('Badge Run')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Continue to destinations' }),
    )
    expect(within(dialog).getByRole('option', { name: 'Tesla Iconic Chargers' })).toBeTruthy()

    fireEvent.change(within(dialog).getByLabelText('Filter by category'), {
      target: { value: 'tesla-badge' },
    })
    ;[
      'Arches',
      'Bryce Canyon',
      'Death Valley',
      'Golden Gate Bridge',
      'Grand Canyon',
      'Joshua Tree',
      'Las Vegas Strip',
      'Miami Beach',
      'Niagara Falls',
      'Oasis',
      'San Antonio River',
      'Santa Monica',
      'Tesla Diner',
      'Waikiki',
      'Whistler',
      'Yellowstone',
      'Yosemite',
    ].forEach((label) => {
      expect(
        within(dialog).getByRole('button', {
          name: `Add ${label} to custom route`,
        }),
      ).toBeTruthy()
    })
    expect(
      (within(dialog).getByLabelText('Add Waikiki to custom route') as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (within(dialog).getByLabelText('Add Whistler to custom route') as HTMLButtonElement)
        .disabled,
    ).toBe(true)

    fireEvent.click(within(dialog).getByLabelText('Add Grand Canyon to custom route'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Review route' }))
    expect(within(dialog).getByText('Review the route, then optimize')).toBeTruthy()
    expect(within(dialog).getByText('Stop order')).toBeTruthy()
    expect(within(dialog).getByText('Badge Run')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save and optimize' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Badge Run',
        targetDays: 60,
        startDate: '2026-04-20',
        waypoints: [expect.objectContaining({ label: 'Grand Canyon' })],
      }),
    )
  })

  it('keeps route cards full-height so custom Edit and Delete actions remain visible', () => {
    const savedRoute: SavedCustomRoute = {
      id: 'saved-test',
      name: 'Saved Test',
      color: '#7c3aed',
      waypoints: [
        {
          id: 'landmark-az-grand-canyon',
          label: 'Grand Canyon',
          position: { lat: 36.1069, lon: -112.1129 },
          radiusMiles: 95,
        },
      ],
      createdAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:00.000Z',
    }
    const route: RoutePlan = {
      id: savedRoute.id,
      plannerMode: 'longest_trip',
      name: savedRoute.name,
      strategy: 'Saved custom route.',
      color: savedRoute.color,
      uniqueStations: 1,
      totalMiles: 100,
      totalDriveHours: 2,
      totalStopHours: 0.3,
      totalDays: 1,
      averageMilesPerDay: 100,
      averageDriveHoursPerDay: 2,
      averageStopHoursPerDay: 0.3,
      averageDistanceBetweenSuperchargers: 100,
      stationsPerDay: 1,
      days: [],
      visits: [],
      warnings: [],
      advisories: [],
      longDays: 0,
      routeLine: [],
      rating: {
        score: 80,
        sceneryScore: 80,
        cityScore: 80,
        landmarkScore: 80,
        places: [],
        summary: 'Test route',
      },
    }

    render(
      <RoutePicker
        routes={[route]}
        selectedRouteId={route.id}
        open
        onClose={vi.fn()}
        onSelect={vi.fn()}
        savedCustomRoutes={[savedRoute]}
        onEditCustomRoute={vi.fn()}
        onDeleteCustomRoute={vi.fn()}
      />,
    )

    const selectButton = screen.getByRole('button', {
      name: 'Select route Saved Test, rating 80 out of 100',
    })
    expect(selectButton.parentElement?.className).toContain('flex-none')
    expect(screen.getByRole('button', { name: 'Edit Saved Test' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete Saved Test' })).toBeTruthy()
  })
})
