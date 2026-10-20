// Datume vedno računamo in izpisujemo v slovenskem časovnem pasu. Strežnik
// (SSR) teče v UTC, brskalnik pa v lokalnem pasu — brez fiksnega pasu se
// izpisi in atributi (npr. `title`) razlikujejo in React javi napako hidracije.

export const TIME_ZONE = "Europe/Ljubljana";

const DAY = 86_400_000;
const keyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Koledarski dan v slovenskem pasu kot "YYYY-MM-DD". */
export const dayKey = (d: string | Date) => keyFormat.format(new Date(d));

/** Celi koledarski dnevi (v slovenskem pasu) med dvema trenutkoma. */
export const daysBetween = (from: string | Date, to: string | Date) =>
  Math.round((Date.parse(dayKey(to)) - Date.parse(dayKey(from))) / DAY);

/** Ključ dneva, ki je `n` dni pred danim ključem. */
export const shiftDayKey = (key: string, n: number) =>
  new Date(Date.parse(key) - n * DAY).toISOString().slice(0, 10);

export const formatDate = (d: string | Date, options: Intl.DateTimeFormatOptions = {}) =>
  new Date(d).toLocaleDateString("sl-SI", { timeZone: TIME_ZONE, ...options });

export const formatTime = (d: string | Date) =>
  new Date(d).toLocaleTimeString("sl-SI", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
