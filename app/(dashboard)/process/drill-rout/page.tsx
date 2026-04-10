import Link from 'next/link'
import { Zap, Wrench } from 'lucide-react'

export default function DrillRoutPage() {
  const channels = [
    {
      title: 'Rout - Speed/Feed Change',
      description: 'MCN records related to rout program speed and feed changes',
      icon: Zap,
      href: '/process/drill-rout/rout-speed-feed',
      color: 'blue',
    },
    // Future channels:
    // {
    //   title: 'Drill Program Changes',
    //   description: 'MCN records for drill program modifications',
    //   icon: Wrench,
    //   href: '/process/drill-rout/drill-changes',
    //   color: 'orange',
    //   disabled: true,
    // },
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Drill / Rout</h2>
      <p className="text-slate-600 mb-6">Engineering change management for drill and rout operations</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((ch) => {
          const Icon = ch.icon
          const isDisabled = (ch as any).disabled

          const card = (
            <div
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Icon className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {ch.title}
                {isDisabled && (
                  <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                    Coming Soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-600">{ch.description}</p>
            </div>
          )

          if (isDisabled) {
            return <div key={ch.title}>{card}</div>
          }

          return (
            <Link key={ch.title} href={ch.href}>
              {card}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
