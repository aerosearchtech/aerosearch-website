import Image from 'next/image';
import { FCI_LOGO, OUTBOX_NOTE } from '../../config/constants';

interface Props {
  deviceId: string;
}

/** FCI logo, link name and connection state for the Anna Darpan page. */
export function SyncHeader({ deviceId }: Props) {
  return (
    <div className="sync-header">
      <Image className="sync-logo is-light" src={FCI_LOGO.light} alt={FCI_LOGO.alt} width={FCI_LOGO.width} height={FCI_LOGO.height} />
      <Image className="sync-logo is-dark" src={FCI_LOGO.dark} alt={FCI_LOGO.alt} width={FCI_LOGO.width} height={FCI_LOGO.height} />
      <div className="sync-title">
        <strong>ANNA DARPAN SYNC</strong>
        <span className="note-text">Device {deviceId} · {OUTBOX_NOTE}</span>
      </div>
      <span className="outbox-state"><i />NOT CONNECTED</span>
    </div>
  );
}
