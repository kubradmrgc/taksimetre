import { NumberField } from "./NumberField.jsx";

export function FareForm({ values, onChange }) {
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(event) => event.preventDefault()}
    >
      <NumberField
        id="distanceKm"
        label="Gidilen mesafe"
        suffix="km"
        value={values.distanceKm}
        onChange={(value) => onChange("distanceKm", value)}
      />
      <NumberField
        id="waitingMinutes"
        label="Bekleme süresi"
        suffix="dk"
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
    </form>
  );
}
