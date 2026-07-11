import { cleanup, render, screen, within } from '@testing-library/react'
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
    expect(
      (within(dialog).getByLabelText('Starting direction preference') as HTMLSelectElement)
        .value,
    ).toBe('seasonal')
    expect(within(dialog).getByLabelText('Trip start month')).toBeTruthy()
    expect(within(dialog).getByRole('option', { name: 'Tesla badge candidates' })).toBeTruthy()
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
