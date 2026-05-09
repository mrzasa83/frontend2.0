'use client'

import Link from 'next/link'
import { FileText, Package } from 'lucide-react'

export default function ChangesPage() {
  const cards = [
    {
      title: 'Standards',
      description: 'Engineering Standard Change Forms (ESCF) — review, approve, and track standard changes',
      icon: FileText,
      href: '/products/changes/standards',
      color: 'blue',
    },
    {
      title: 'Products',
      description: 'Product-level engineering changes and revision management',
      icon: Package,
      href: '/products/changes/products',
      color: 'emerald',
      disabled: true,
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Changes</h2>
      <p className="text-slate-600 mb-6">Engineering change management</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <div key={card.title} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${card.disabled ? 'opacity-60' : ''}`}>
            {card.disabled ? (
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg ${colorMap[card.color]} flex items-center justify-center mb-4`}>
                  <card.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500">{card.description}</p>
                <span className="inline-block mt-3 text-xs text-slate-400 bg-slate-100 rounded px-2 py-1">Coming Soon</span>
              </div>
            ) : (
              <Link href={card.href} className="block p-6">
                <div className={`w-12 h-12 rounded-lg ${colorMap[card.color]} flex items-center justify-center mb-4`}>
                  <card.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600">{card.description}</p>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
