import Wordmark from "@/components/ui/Wordmark";
import { demo } from "@/theme/content";
import DemoCard from "./DemoCard";

export default function DemoIndex() {
  return (
    <div className="min-h-full bg-night text-bone">
      <header className="flex h-16 items-center px-6 md:px-10">
        <Wordmark />
      </header>

      <div className="shell py-16 md:py-20">
        <h1 className="display text-3xl text-bone">{demo.title}</h1>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {demo.items.map((item, i) => (
            <li key={item.slug}>
              <DemoCard index={i + 1} href={item.href} label={item.label} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
