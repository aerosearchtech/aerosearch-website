import { NAV_ITEMS } from '../../config/constants';
import type { Screen } from '../../types/analysis';

interface Props {
  screen: Screen;
  reportBadge: boolean;
  onScreen: (screen: Screen) => void;
}

export function SideNav({ screen, reportBadge, onScreen }: Props) {
  return (
    <nav className="side-nav">
      {NAV_ITEMS.map((n) => (
        <button key={n.id} type="button" className={n.id === screen ? 'is-active' : ''} onClick={() => onScreen(n.id)}>
          <span className="nav-num">{n.num}</span>
          <span className="nav-label">{n.label}</span>
          {n.id === 'report' && reportBadge && <span className="nav-badge" title="Officer decision pending">1</span>}
        </button>
      ))}
    </nav>
  );
}
