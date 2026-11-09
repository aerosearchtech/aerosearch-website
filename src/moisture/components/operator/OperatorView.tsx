import ReadingPanel from './ReadingPanel';
import RecordPanel from './RecordPanel';

export default function OperatorView() {
  return (
    <main className="m-view" style={{ gridTemplateColumns: 'minmax(0, 1fr) 440px' }}>
      <ReadingPanel />
      <RecordPanel />
    </main>
  );
}
