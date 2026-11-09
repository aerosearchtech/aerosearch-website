import type { ModelInfo } from '../../types/analysis';
import { pct } from '../../utils/format';

interface Props {
  model: ModelInfo | null;
}

export function StatusFooter({ model }: Props) {
  return (
    <footer className="status-footer">
      <div>
        {model ? (
          <>
            <span>MODEL <b>{model.arch.split(',')[0].toUpperCase()}</b></span>
            <span>HELD-OUT ACC <b>{pct(model.test_accuracy * 100, 1)}</b></span>
            <span>MACRO F1 <b>{pct(model.test_macro_f1 * 100, 1)}</b></span>
            <span>DATA <b>GRAINSET · CC BY-NC-SA 4.0</b></span>
          </>
        ) : (
          <span>NO MODEL LOADED</span>
        )}
        <span>LIMITS <b>INDICATIVE</b></span>
      </div>
      <div>RECORDED ON THE ANALYZER · REPLAYED IN THIS BROWSER · DEMO SIGNING KEY</div>
    </footer>
  );
}
