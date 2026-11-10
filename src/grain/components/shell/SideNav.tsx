import { NAV_ITEMS } from '../../config/constants';
import type { Screen } from '../../types/analysis';

interface Props {
  screen: Screen;
  /** Count shown on a nav item, e.g. a pending decision or queued records. */
  badges: Partial<Record<Screen, number>>;
  onScreen: (screen: Screen) => void;
}

export function SideNav({ screen, badges, onScreen }: Props) {
  return (
    <nav className="side-nav">
      {NAV_ITEMS.map((n) => (
        <button key={n.id} type="button" className={n.id === screen ? 'is-active' : ''} onClick={() => onScreen(n.id)}>
          <span className="nav-num">{n.num}</span>
          <span className="nav-label">{n.label}</span>
          {Boolean(badges[n.id]) && <span className="nav-badge">{badges[n.id]}</span>}
        </button>
      ))}
    </nav>
  );
}
