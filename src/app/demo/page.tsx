import DemoGate from "./DemoGate";
import DemoIndex from "./DemoIndex";

export default function DemoPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <DemoIndex />
      </DemoGate>
    </main>
  );
}
