import { useState, type ReactNode } from 'react'
import type { DayPlan, PlannerAdvisory, RoutePlan, RouteStationVisit } from '../domain/types'
import { dayHighlights } from '../domain/highlights'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Chip, Pill, StatTile, cx } from '../ui/primitives'
import { AlertIcon, InfoIcon } from '../ui/icons'

export interface DayDetailModalProps {
  day?: DayPlan
  route?: RoutePlan
  onClose: () => void
}

const VISIT_CAP = 40
const TARGET_CAP = 14

function fmtMinutes(m: number): string {
  const total = Math.max(0, Math.round(m))
  const h = Math.floor(total / 60)
  const min = total % 60
  if (h <= 0) return `${min}m`
  if (min === 0) return `${h}h`
  return `${h}h ${min}m`
}

export function DayDetailModal({ day, route, onClose }: DayDetailModalProps) {
  const [showAllVisits, setShowAllVisits] = useState(false)

  return (
    <Overlay open={Boolean(day)} onClose={onClose} size="detail" labelledBy="day-detail-title">
      {day ? (
        <DayDetailContent
          day={day}
          route={route}
          onClose={onClose}
          showAllVisits={showAllVisits}
          setShowAllVisits={setShowAllVisits}
        />
      ) : null}
    </Overlay>
  )
}

function DayDetailContent({
  day,
  route,
  onClose,
  showAllVisits,
  setShowAllVisits,
}: {
  day: DayPlan
  route?: RoutePlan
  onClose: () => void
  showAllVisits: boolean
  setShowAllVisits: (v: boolean) => void
}) {
  const cities = day.visits.map((visit) => visit.station.address.city)
  const firstCity = cities[0] ?? '—'
  const lastCity = cities[cities.length - 1] ?? '—'

  const highlights = dayHighlights(day)

  const driveMin = Math.round(day.driveHours * 60)
  const totalMin = driveMin + day.stopMinutes
  const drivePct = totalMin > 0 ? (driveMin / totalMin) * 100 : 0
  const chargePct = totalMin > 0 ? (day.stopMinutes / totalMin) * 100 : 0

  const targetCities = dedupeAdjacent(cities)
  const targetsShown = targetCities.slice(0, TARGET_CAP)
  const targetsOverflow = targetCities.length - targetsShown.length

  const hasNotes = day.warnings.length > 0 || day.advisories.length > 0

  const visitsShown =
    showAllVisits || day.visits.length <= VISIT_CAP
      ? day.visits
      : day.visits.slice(0, VISIT_CAP)
  const hiddenVisitCount = day.visits.length - visitsShown.length

  return (
    <>
      <OverlayHeader
        badge={
          <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-accent font-mono text-[16px] font-semibold text-on-accent">
            {day.day}
          </div>
        }
        kicker={`Day ${day.day} · ${route?.name ?? 'Route'}`}
        title={
          <span className="block truncate">
            {firstCity} <span className="text-faint"> → </span> {lastCity}
          </span>
        }
        subtitle={`${day.uniqueStations} Superchargers · ${day.miles.toLocaleString()} mi`}
        titleId="day-detail-title"
        onClose={onClose}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 md:px-6">
        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile label="Miles traveled" value={day.miles.toLocaleString()} unit="mi" />
          <StatTile label="Drive time" value={day.driveHours.toFixed(1)} unit="h" />
          <StatTile label="Charge stops" value={day.visits.length} />
          <StatTile label="Charge time" value={fmtMinutes(day.stopMinutes)} />
          <StatTile label="Unique stations" value={day.uniqueStations} />
          <StatTile
            label="Avg gap"
            value={day.averageDistanceBetweenSuperchargers.toFixed(1)}
            unit="mi"
          />
        </div>

        {/* Time split */}
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.05em] text-faint">
            <span>Time split</span>
            <span>{fmtMinutes(totalMin)}</span>
          </div>
          <div className="flex h-[13px] overflow-hidden rounded border border-edge">
            <div className="h-full bg-accent" style={{ width: `${drivePct}%` }} aria-hidden />
            <div className="h-full bg-accent2" style={{ width: `${chargePct}%` }} aria-hidden />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-[18px] gap-y-1.5 text-[12px] text-dim">
            <span className="flex items-center gap-[7px]">
              <span className="h-[9px] w-[9px] flex-none rounded-[3px] bg-accent" aria-hidden />
              Driving <span className="font-mono">{fmtMinutes(driveMin)}</span>
            </span>
            <span className="flex items-center gap-[7px]">
              <span className="h-[9px] w-[9px] flex-none rounded-[3px] bg-accent2" aria-hidden />
              Charging <span className="font-mono">{fmtMinutes(day.stopMinutes)}</span>
            </span>
          </div>
        </div>

        {/* Landmarks */}
        {highlights.length > 0 ? (
          <div>
            <SectionLabel>Landmarks seen</SectionLabel>
            <div className="flex flex-wrap gap-[7px]">
              {highlights.map((highlight) => (
                <span
                  key={highlight.id}
                  className="inline-flex items-center gap-[7px] rounded-[9px] border border-edge bg-panel2 px-3 py-1.5 text-[12.5px] text-ink"
                  title={highlight.summary}
                >
                  <span className="text-accent2" aria-hidden>
                    ◆
                  </span>
                  {highlight.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Route targets */}
        {targetsShown.length > 0 ? (
          <div>
            <SectionLabel>Route targets</SectionLabel>
            <div className="flex flex-wrap gap-[7px]">
              {targetsShown.map((city, i) => (
                <Chip key={`${city}-${i}`} index={i + 1} label={city} />
              ))}
              {targetsOverflow > 0 ? (
                <Chip label={`+${targetsOverflow}`} className="text-dim" />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Planning notes */}
        {hasNotes ? (
          <div>
            <SectionLabel>Planning notes</SectionLabel>
            <div className="flex flex-col gap-2">
              {day.warnings.map((warning, i) => (
                <NoteCard key={`warn-${i}`} tone="warn" icon={<AlertIcon size={14} />}>
                  {warning}
                </NoteCard>
              ))}
              {day.advisories.map((advisory, i) => (
                <NoteCard
                  key={`adv-${i}`}
                  tone={advisoryTone(advisory)}
                  icon={
                    advisory.severity === 'high' ? (
                      <AlertIcon size={14} />
                    ) : (
                      <InfoIcon size={14} />
                    )
                  }
                >
                  {advisory.message}
                </NoteCard>
              ))}
            </div>
          </div>
        ) : null}

        {/* Supercharger sequence */}
        {day.visits.length > 0 ? (
          <div>
            <SectionLabel>Supercharger sequence</SectionLabel>
            <div className="flex flex-col gap-2">
              {visitsShown.map((visit) => (
                <VisitCard key={`${visit.sequence}-${visit.station.id}`} visit={visit} />
              ))}
            </div>
            {hiddenVisitCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllVisits(true)}
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-edge bg-panel2 px-3 text-[13px] font-medium text-ink transition hover:brightness-95"
              >
                Show all {day.visits.length}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.05em] text-faint">
      {children}
    </div>
  )
}

function NoteCard({
  tone,
  icon,
  children,
}: {
  tone: 'warn' | 'info'
  icon: ReactNode
  children: ReactNode
}) {
  const toneClass =
    tone === 'warn'
      ? 'bg-warn-bg border-warn-bd text-warn'
      : 'bg-info-bg border-info-bd text-info'
  return (
    <div className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3', toneClass)}>
      <span className="mt-px flex-none" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 text-[12.5px] leading-snug text-ink">{children}</span>
    </div>
  )
}

function VisitCard({ visit }: { visit: RouteStationVisit }) {
  const { station } = visit
  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-panel2 px-3 py-2.5">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-chip font-mono text-[11px] font-semibold text-ink">
        {visit.sequence}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-ink">{station.name}</div>
        <div className="truncate font-mono text-[11px] text-faint">
          {station.address.city}, {station.address.state}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2">
        {visit.rangeWarning ? (
          <Pill tone="warn" className="px-2 py-0.5 text-[10.5px]">
            range
          </Pill>
        ) : null}
        <div className="flex flex-col items-end gap-px font-mono text-[10.5px] leading-tight text-dim">
          <span>{Math.round(visit.legMiles)} mi</span>
          <span>{visit.driveHours.toFixed(1)}h</span>
          <span>{Math.round(visit.stopMinutes)}m</span>
        </div>
      </div>
    </div>
  )
}

function advisoryTone(advisory: PlannerAdvisory): 'warn' | 'info' {
  return advisory.severity === 'high' ? 'warn' : 'info'
}

function dedupeAdjacent(values: string[]): string[] {
  const out: string[] = []
  for (const value of values) {
    if (out[out.length - 1] !== value) out.push(value)
  }
  return out
}
