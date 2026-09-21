import Wordmark from "@/components/ui/Wordmark";
import { demo } from "@/theme/content";

export default function DemoIndex() {
  return (
    <div className="min-h-full bg-night text-bone">
      <header className="flex h-16 items-center px-6 md:px-10">
        <Wordmark />
      </header>

      <div className="shell py-16 md:py-20">
        <h1 className="display text-3xl text-bone">{demo.title}</h1>
        <ul className="mt-8 space-y-3">
          {demo.items.map((item) => (
            <li key={item.slug}>
              <a href={item.href} className="text-bone-muted hover:text-bone">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
