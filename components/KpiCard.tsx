/**
 * KPI card component used on the dashboard page.
 *
 * Displays a single KPI (e.g. "Scope 1 Total") with a large value and an
 * optional icon / colour accent.
 */

interface KpiCardProps {
  title: string
  value: string
  unit?: string
  icon?: string
  accent?: 'green' | 'blue' | 'orange' | 'purple'
  description?: string
}

const accentClasses = {
  green: 'border-green-500 bg-green-50',
  blue: 'border-blue-500 bg-blue-50',
  orange: 'border-orange-500 bg-orange-50',
  purple: 'border-purple-500 bg-purple-50',
}

const valueClasses = {
  green: 'text-green-700',
  blue: 'text-blue-700',
  orange: 'text-orange-700',
  purple: 'text-purple-700',
}

/**
 * Renders a dashboard KPI card.
 *
 * @param title       - Card heading (e.g. "Scope 1")
 * @param value       - Pre-formatted value string (e.g. "45.20")
 * @param unit        - Unit label shown below the value (defaults to "tCO₂e")
 * @param icon        - Emoji icon shown in the corner
 * @param accent      - Colour accent for the left border
 * @param description - Optional sub-text description
 */
export function KpiCard({
  title,
  value,
  unit = 'tCO₂e',
  icon,
  accent = 'green',
  description,
}: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border-l-4 shadow-sm p-5 bg-white ${accentClasses[accent]}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold mt-2 ${valueClasses[accent]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
      {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    </div>
  )
}
