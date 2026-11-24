/* Etichette e impostazioni usate da più schermate. */
import { RACE_DEFAULT, type Vol } from "./plan";
import { store } from "./store";

export const VOLS: Vol[] = ["basso", "medio", "alto"];
export const VL: Record<Vol, string> = { basso: "Basso", medio: "Medio", alto: "Alto" };
export const PROG_LABEL = { bjj: "Gara BJJ", transizione: "Transizione", ironman: "Ironman" };
export const raceDate = () => store.settings().raceDate || RACE_DEFAULT;
