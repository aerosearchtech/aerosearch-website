import { create } from 'zustand';
import { classify } from './bands';
import { FIRST_RECORD_NO, METER_ENV, NODE_KEY_ID, NODE_SOFTWARE, OFFICER_ID, SCENARIOS } from './constants';
import { signText } from './crypto';
import { meterStamp } from './format';
import type { ThemeName } from './theme';
import type { Decision, MeterReading, Role, ScenarioId, SealedRecord } from './types';

interface MoistureState {
  theme: ThemeName;
  role: Role;
  scenario: ScenarioId;
  reading: MeterReading | null;
  records: SealedRecord[];
  linkUp: boolean;
  busy: boolean;
  setTheme: (theme: ThemeName) => void;
  setRole: (role: Role) => void;
  setLink: (up: boolean) => void;
  takeReading: (scenario: ScenarioId) => void;
  discard: () => void;
  seal: () => Promise<void>;
  decide: (no: number, decision: Decision) => Promise<void>;
}

/** Builds the reading as the node would parse it off the meter's port. */
function readMeter(scenario: ScenarioId): MeterReading {
  const at = new Date();
  const { moisture } = SCENARIOS[scenario];
  const { tempC, rh, curve, cup } = METER_ENV;
  const line = `M=${moisture.toFixed(1)} T=${tempC.toFixed(1)} RH=${rh} C=${curve} CUP=${cup} ${meterStamp(at)}`;
  return { moisture, tempC, rh, curve, cup, at, line };
}

export const useMoisture = create<MoistureState>()((set, get) => ({
  theme: 'dark',
  role: 'operator',
  scenario: 'cut',
  reading: readMeter('cut'),
  records: [],
  linkUp: true,
  busy: false,
  setTheme: (theme) => set({ theme }),
  setRole: (role) => set({ role }),
  /** Reconnecting flushes the encrypted queue. */
  setLink: (up) =>
    set(({ records }) => ({ linkUp: up, records: up ? records.map((r) => ({ ...r, synced: true })) : records })),
  takeReading: (scenario) => set({ scenario, reading: readMeter(scenario) }),
  discard: () => set({ reading: null }),
  seal: async () => {
    const { reading, records, busy, linkUp } = get();
    if (!reading || busy) return;
    set({ busy: true });
    try {
      const node = await signText(NODE_KEY_ID, reading.line);
      const record: SealedRecord = {
        no: FIRST_RECORD_NO + records.length,
        reading,
        band: classify(reading.moisture),
        node,
        software: NODE_SOFTWARE,
        synced: linkUp,
      };
      set({ records: [...records, record], reading: null });
    } finally {
      set({ busy: false });
    }
  },
  decide: async (no, decision) => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const record = get().records.find((r) => r.no === no);
      if (!record) return;
      const officer = await signText(OFFICER_ID, `${record.node.sig}|${decision}`);
      set({ records: get().records.map((r) => (r.no === no ? { ...r, decision, officer } : r)) });
    } finally {
      set({ busy: false });
    }
  },
}));

/** Records that reached Anna Darpan and still wait for the officer. */
export const pendingRecords = (records: SealedRecord[]): SealedRecord[] =>
  records.filter((r) => r.synced && !r.decision);

/** Records the node still holds, encrypted, until the link returns. */
export const queuedRecords = (records: SealedRecord[]): SealedRecord[] => records.filter((r) => !r.synced);
