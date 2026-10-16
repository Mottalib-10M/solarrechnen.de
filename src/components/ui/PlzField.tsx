/** Postleitzahl: fünf Ziffern, Text als Quelle der Wahrheit, gleiche Rasterzeilen wie NumberField (RECETTE §10.3). */
interface Props { id: string; label: string; value: string; onChange: (v: string) => void; help?: string; className?: string }
export default function PlzField({ id, label, value, onChange, help, className = '' }: Props) {
  return (
    <div className={`grid grid-rows-subgrid row-span-3 content-start gap-y-0 ${className}`}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <div className="relative self-start">
        <input id={id} type="text" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))} onFocus={(e) => e.currentTarget.select()}
          aria-describedby={help ? `${id}-help` : undefined}
          className="tabular-nums h-12 w-full rounded-lg border border-navy-300 bg-white px-4 text-lg tracking-wider text-navy-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20" />
      </div>
      {help && <p id={`${id}-help`} className="mt-1 text-xs text-navy-600">{help}</p>}
    </div>
  );
}
