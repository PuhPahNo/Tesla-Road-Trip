import { useId, useState } from 'react'
import { haversineMiles } from '../domain/geo'
import type { StateRouteStats } from '../domain/routeStats'
import { STATE_SIGNATURES, type StateSignature } from '../domain/stateSignatures'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { detailForDestination, detailForSignature } from '../domain/placeDetails'
import { LONGEST_TRIP_DESTINATIONS } from '../domain/visitTargets'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, Chip, StatTile, cx, scoreColor } from '../ui/primitives'

export interface StateDetailModalProps {
  state?: StateRouteStats
  onClose: () => void
}

const CITY_CAP = 24

export function StateDetailModal({ state, onClose }: StateDetailModalProps) {
  const titleId = useId()
  const [citiesExpanded, setCitiesExpanded] = useState(false)

  if (!state) return null

  const fullName = STATE_CODE_TO_NAME[state.state] ?? state.state
  const visibleCities = citiesExpanded ? state.cities : state.cities.slice(0, CITY_CAP)
  const hiddenCities = state.cities.length - visibleCities.length
  const signatures = STATE_SIGNATURES[state.state] ?? []
  const signatureCards = signatures.map((signature) => buildSignatureCard(signature, state))
  const majorCities = LONGEST_TRIP_DESTINATIONS.filter(
    (destination) => destination.type === 'city' && destination.state === state.state,
  ).map((destination) => {
    const detail = detailForDestination(destination)
    const covered = state.visits.some(
      (visit) =>
        haversineMiles(visit.station.position, destination.position) <=
        destination.radiusMiles,
    )
    return { destination, detail, covered }
  })
  const missingSignatureCards = signatureCards.filter((card) => !card.covered)
  const missingMajorCities = majorCities.filter((city) => !city.covered)

  return (
    <Overlay open onClose={onClose} size="detail" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker="State coverage"
        title={fullName}
        meta={`${state.routeStations} of ${state.totalStations} filtered Superchargers visited`}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-[18px]">
        <div className="grid grid-cols-2 gap-2.5">
          <StatTile label="On route" value={state.routeStations} />
          <StatTile label="Coverage" value={state.coveragePct} unit="%" />
          <StatTile label="Total sites" value={state.totalStations} />
          <StatTile label="Miles in state" value={state.miles.toLocaleString()} />
          <StatTile label="Route days" value={state.days.length} />
          <StatTile label="Avg gap" value={state.averageDistanceBetweenSuperchargers} unit="mi" />
        </div>

        {(missingSignatureCards.length > 0 || missingMajorCities.length > 0) && (
          <section className="mt-5">
            <SectionLabel>Missed opportunities</SectionLabel>
            <div className="mt-2 flex flex-col gap-2">
              {missingSignatureCards.slice(0, 4).map((card) => (
                <MissedRow
                  key={card.signature.id}
                  label={card.signature.label}
                  meta={`${card.detail.rating}/100 landmark`}
                />
              ))}
              {missingMajorCities.slice(0, 3).map(({ destination, detail }) => (
                <MissedRow
                  key={destination.id}
                  label={destination.label}
                  meta={`${detail.rating}/100 city`}
                />
              ))}
            </div>
          </section>
        )}

        {signatureCards.length > 0 && (
          <section className="mt-5">
            <SectionLabel>Signature landmarks</SectionLabel>
            <div className="mt-2 flex flex-col gap-2.5">
              {signatureCards.map((card) => (
                <SignatureCard key={card.signature.id} card={card} />
              ))}
            </div>
          </section>
        )}

        {majorCities.length > 0 && (
          <section className="mt-5">
            <SectionLabel>Major cities</SectionLabel>
            <div className="mt-2 flex flex-col gap-2">
              {majorCities.map(({ destination, detail, covered }) => (
                <div
                  key={destination.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-edge bg-chip px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-ink">
                      {destination.label}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-dim">
                      {detail.summary}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-mono text-[13px] font-semibold"
                      style={{ color: scoreColor(detail.rating) }}
                    >
                      {detail.rating}
                    </div>
                    <div
                      className={cx(
                        'mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em]',
                        covered ? 'text-good' : 'text-faint',
                      )}
                    >
                      {covered ? 'Visited' : 'Missed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {state.cities.length > 0 && (
          <div className="mt-5">
            <SectionLabel>Cities visited</SectionLabel>
            <div className="flex flex-wrap items-center gap-[7px]">
              {visibleCities.map((city) => (
                <Chip key={city} label={city} />
              ))}
              {hiddenCities > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCitiesExpanded(true)}
                  aria-label={`Show ${hiddenCities} more cities`}
                >
                  +{hiddenCities} more
                </Button>
              )}
            </div>
          </div>
        )}

        {state.highlights.length > 0 && (
          <div className="mt-5">
            <SectionLabel>Current route highlights</SectionLabel>
            <div className="mt-2 flex flex-col gap-2">
              {state.highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border border-edge bg-chip px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-ink">
                      {highlight.label}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-dim">
                      {highlight.summary}
                    </div>
                  </div>
                  <span
                    className="font-mono text-[13px] font-semibold"
                    style={{ color: scoreColor(highlight.rating) }}
                  >
                    {highlight.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Overlay>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-[9px] font-mono text-[10px] uppercase tracking-[0.05em] text-faint">
      {children}
    </div>
  )
}

function MissedRow({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border border-edge bg-panel2 px-3 py-2">
      <span className="min-w-0 truncate text-[12px] text-ink">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-faint">
        {meta}
      </span>
    </div>
  )
}

interface SignatureCardModel {
  signature: StateSignature
  detail: ReturnType<typeof detailForSignature>
  covered: boolean
  nearest?: {
    label: string
    miles: number
  }
}

function SignatureCard({ card }: { card: SignatureCardModel }) {
  return (
    <article
      className={cx(
        'rounded-[11px] border p-3',
        card.covered ? 'border-accent2 bg-chip' : 'border-edge bg-panel2',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-ink">
            {card.signature.label}
          </div>
          <div
            className={cx(
              'mt-1 font-mono text-[9.5px] uppercase tracking-[0.08em]',
              card.covered ? 'text-accent2' : 'text-faint',
            )}
          >
            {card.covered ? 'On this route' : 'Not on this route'}
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-mono text-[18px] font-semibold leading-none"
            style={{ color: scoreColor(card.detail.rating) }}
          >
            {card.detail.rating}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
            rating
          </div>
        </div>
      </div>

      <div className="mt-2 text-[12px] leading-[1.45] text-dim">
        {card.detail.summary}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {card.detail.activities.slice(0, 4).map((activity) => (
          <span
            key={activity}
            className="rounded-full border border-edge bg-chip px-2 py-1 text-[10.5px] text-dim"
          >
            {activity}
          </span>
        ))}
      </div>
      <div className="mt-2 font-mono text-[10.5px] leading-[1.45] text-faint">
        {card.detail.popularity}
        {card.nearest
          ? ` · nearest route stop: ${card.nearest.label}, ${Math.round(card.nearest.miles)} mi`
          : ''}
      </div>
    </article>
  )
}

function buildSignatureCard(
  signature: StateSignature,
  state: StateRouteStats,
): SignatureCardModel {
  const detail = detailForSignature(signature, state.state)
  const distances = state.visits
    .map((visit) => ({
      label: `${visit.station.address.city}, ${visit.station.address.state}`,
      miles: haversineMiles(visit.station.position, signature.position),
    }))
    .sort((a, b) => a.miles - b.miles)
  const nearest = distances[0]
  const covered = Boolean(nearest && nearest.miles <= signature.radiusMiles)

  return {
    signature,
    detail,
    covered,
    ...(nearest ? { nearest } : {}),
  }
}
