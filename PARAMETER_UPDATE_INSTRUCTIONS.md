# Parameter Display Update Instructions

## What Changed:
Added `ExtraParameters` column from DATA0471 + DATA0469 to all route queries.

## UI Update Required:
Replace all instances of the parameter display cell with the following pattern:

### Original Pattern:
```tsx
<td className="px-3 py-2 border-b">
  {row.ParameterList ? (
    <div className="font-mono text-xs">
      {row.ParameterList.split('; ').map((param: string, i: number) => (
        <div key={i} className="mb-1">{param}</div>
      ))}
    </div>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>
```

### New Pattern (with ExtraParameters):
```tsx
<td className="px-3 py-2 border-b">
  {row.ParameterList || row.ExtraParameters ? (
    <div className="font-mono text-xs">
      {row.ParameterList && row.ParameterList.split('; ').map((param: string, i: number) => (
        <div key={i} className="mb-1">{param}</div>
      ))}
      {row.ExtraParameters && row.ExtraParameters.split('; ').map((param: string, i: number) => (
        <div key={`extra-${i}`} className="mb-1 text-blue-600">{param}</div>
      ))}
    </div>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>
```

## Locations in app/page.tsx to update:
- Line ~843: Customer Part Route table
- Line ~884: Inventory Part Route table  
- Line ~1243: Product Tab route display

## What this does:
- Shows regular parameters in black
- Shows ExtraParameters in blue (text-blue-600)
- Handles cases where only one type exists
- Handles cases where neither exist (shows "-")

## ExtraParameters Format:
Same semicolon-separated format as ParameterList:
```
PANEL_SIZE=18x24; MATERIAL=FR4; THICKNESS=0.062
```
