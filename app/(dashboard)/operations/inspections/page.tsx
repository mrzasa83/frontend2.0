'use client'

import Link from 'next/link'
import { ClipboardCheck, Microscope, ScanEye, ArrowLeft } from 'lucide-react'

export default function InspectionsPage() {
  const cards = [
    {
      title: 'First Article Inspection',
      description: 'FAI workflow for PCB and ASM — setup, measurement, verification, and signoff',
      icon: ClipboardCheck,
      href: '/operations/inspections/first-article',
      color: 'blue',
    },
    {
      title: 'X-Section Lab',
      description: 'Cross-section microsectioning analysis and reporting',
      icon: Microscope,
      href: '#',
      color: 'purple',
      disabled: true,
    },
    {
      title: 'AOI',
      description: 'Automated Optical Inspection results and tracking',
      icon: ScanEye,
      href: '#',
      color: 'emerald',
      disabled: true,
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/operations" className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-slate-800">Inspections</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-9">Quality inspection workflows</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          const content = (
            <div className={`bg-white rounded-xl border border-slate-200 p-6 transition-all ${
              card.disabled ? 'opacity-60' : 'hover:border-blue-300 hover:shadow-md cursor-pointer'
            }`}>
              <div className={`w-12 h-12 rounded-lg ${colorMap[card.color]} flex items-center justify-center mb-4`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                {card.title}
                {card.disabled && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Coming Soon</span>}
              </h3>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
          )
          return card.disabled
            ? <div key={card.title}>{content}</div>
            : <Link key={card.title} href={card.href}>{content}</Link>
        })}
      </div>
    </div>
  )
}
