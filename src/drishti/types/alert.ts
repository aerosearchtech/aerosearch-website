export type AlertSeverity = "INFO" | "WARN" | "ALERT" | "CRITICAL";

export interface Alert {
  time: string; // ZULU "HHMMZ"
  sev: AlertSeverity;
  msg: string;
}
