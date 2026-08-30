export function NumberField({
  id,
  label,
  hint,
  suffix,
  value,
  onChange,
  placeholder = "0",
  readOnly = false,
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-ink/80 dark:text-stone-200">
        {label}
      </span>
      <div className="relative mt-1.5">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          readOnly={readOnly}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2.5 pr-12 text-base text-ink shadow-sm outline-none transition placeholder:text-stone-400 focus:border-taxi focus:ring-2 focus:ring-taxi/30 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:placeholder:text-stone-500 ${
            readOnly ? "cursor-default opacity-80" : ""
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium tracking-wide text-stone-500 dark:text-stone-400">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
