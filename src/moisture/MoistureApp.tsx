'use client';

import Header from './components/Header';
import HqView from './components/hq/HqView';
import OfficerView from './components/officer/OfficerView';
import OperatorView from './components/operator/OperatorView';
import { useMoisture } from './lib/store';
import type { Role } from './lib/types';

const VIEWS: Record<Role, () => JSX.Element> = {
  operator: OperatorView,
  officer: OfficerView,
  hq: HqView,
};

export default function MoistureApp() {
  const { role, theme } = useMoisture();
  const View = VIEWS[role];
  return (
    <div className="moist-root" data-theme={theme}>
      <Header />
      <View />
    </div>
  );
}
