import { NumberField } from "./NumberField.jsx";
import { ISTANBUL_TOLLS } from "../lib/tolls.js";
import { ISTANBUL_SEGMENTS } from "../lib/istanbulSegments.js";

export function FareForm({
  values,
  onChange,
  tripLocked = false,
  cityId = null,
  segmentId = "yellow",
  onSegmentChange,
  roundTrip = false,
  onRoundTripChange,
  selectedTollIds = [],
  onToggleToll,
}) {
  const showIstanbulExtras = cityId === "istanbul";

  return (
    <div className="space-y-5">
      {showIstanbulExtras ? (
        <fieldset>
          <legend className="text-sm font-medium text-ink dark:text-stone-200">
            Taksi segmenti
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ISTANBUL_SEGMENTS.map((segment) => {
              const active = segmentId === segment.id;
              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() => onSegmentChange?.(segment.id)}
                  className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-taxi bg-taxi text-ink"
                      : "border-stone-300/80 bg-white hover:border-taxi/70 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {segment.shortName}
                  </span>
                  <span className="mt-0.5 block text-[11px] opacity-70">
                    {segment.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <NumberField
          id="distanceKm"
          label="Gidilen mesafe"
          suffix="km"
          hint={tripLocked ? "GPS ile güncelleniyor" : undefined}
          readOnly={tripLocked}
          value={values.distanceKm}
          onChange={(value) => onChange("distanceKm", value)}
        />
        <NumberField
          id="waitingMinutes"
          label="Bekleme süresi"
          suffix="dk"
          hint={tripLocked ? "Hız < 10 km/s iken birikir" : undefined}
          readOnly={tripLocked}
          value={values.waitingMinutes}
          onChange={(value) => onChange("waitingMinutes", value)}
        />
        <NumberField
          id="openingFee"
          label="Açılış ücreti"
          suffix="₺"
          value={values.openingFee}
          onChange={(value) => onChange("openingFee", value)}
        />
        <NumberField
          id="perKmFee"
          label="Kilometre başına ücret"
          suffix="₺"
          value={values.perKmFee}
          onChange={(value) => onChange("perKmFee", value)}
        />
        <NumberField
          id="perMinuteFee"
          label="Dakika başına ücret"
          hint="Bekleme / zaman tarifesi"
          suffix="₺"
          value={values.perMinuteFee}
          onChange={(value) => onChange("perMinuteFee", value)}
        />
        <NumberField
          id="minimumFee"
          label="Minimum (indi-bindi)"
          hint="Ara toplam bunun altındaysa bu tutar alınır"
          suffix="₺"
          value={values.minimumFee}
          onChange={(value) => onChange("minimumFee", value)}
        />
        <NumberField
          id="tolls"
          label="Geçişler"
          hint="Köprü, tünel, otoyol (toplam)"
          suffix="₺"
          value={values.tolls}
          onChange={(value) => onChange("tolls", value)}
        />
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink dark:text-stone-200">
          <input
            type="checkbox"
            checked={roundTrip}
            onChange={(event) => onRoundTripChange?.(event.target.checked)}
            className="size-4 rounded border-stone-400 text-taxi focus:ring-taxi"
          />
          Gidiş-dönüş
        </label>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Yolculuk bedeli ×2; geçişler ayrı eklenir
        </span>
      </div>

      {showIstanbulExtras ? (
        <fieldset>
          <legend className="text-sm font-medium text-ink dark:text-stone-200">
            Hazır geçişler (İstanbul)
          </legend>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            HGS sınıf 1 yaklaşık tutarlar; güncel operatör tarifesini kontrol edin.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ISTANBUL_TOLLS.map((toll) => {
              const active = selectedTollIds.includes(toll.id);
              return (
                <button
                  key={toll.id}
                  type="button"
                  onClick={() => onToggleToll?.(toll.id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-taxi bg-taxi/25 text-ink dark:text-stone-100"
                      : "border-stone-300/80 bg-white text-ink hover:border-taxi/70 dark:border-white/10 dark:bg-white/5 dark:text-stone-100"
                  }`}
                >
                  {toll.name}
                  <span className="ml-1 font-mono opacity-80">{toll.amount} ₺</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
