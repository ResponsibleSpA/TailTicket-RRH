interface QueueTranslator {
  (key: string, values?: { count: number }): string;
  has(key: string): boolean;
}

/** Il nome della coda può già essere tradotto nel DB; il conteggio riguarda l'intera coda. */
export function formatQueueName(title: string, count: number | null, t: QueueTranslator): string {
  if (title === "Open" || title === "Aperto" || title === "Aperti") {
    return count === null ? t("Open") : t("openCount", { count });
  }
  return t.has(title) ? t(title) : title;
}
