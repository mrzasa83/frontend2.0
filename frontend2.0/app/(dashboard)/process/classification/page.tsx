import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function ClassificationPage() {
  const channels = [
    {
      title: 'USML Classification',
      description: 'United States Munitions List (22 CFR Part 121) — ITAR category browser',
      icon: Shield,
      href: '/process/classification/usml',
      color: 'red',
    },
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Classification</h2>
      <p className="text-slate-600 mb-6">Export control classification and compliance reference</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((ch) => {
          const Icon = ch.icon
          return (
            <Link key={ch.title} href={ch.href}>
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <Icon className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{ch.title}</h3>
                <p className="text-sm text-slate-600">{ch.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
