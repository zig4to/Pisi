// Zapis v dnevniku dela, ki ga samodejno doda obkljukan korak.
export const STEP_DONE_PREFIX = "Opravljen korak: ";

export const stepDoneEntry = (title: string) => STEP_DONE_PREFIX + title;
