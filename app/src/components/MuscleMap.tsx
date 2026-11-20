import { maps } from "../engine/figure.js";
export default function MuscleMap({ p, s }: { p: string[]; s: string[] }) {
  return <div className="musmap" dangerouslySetInnerHTML={{ __html: maps(p, s) }} />;
}
