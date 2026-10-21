// Composite every canvas inside `root` into one PNG at device resolution and download it.
export function exportPng(root: HTMLElement, name: string, background: string): void {
  const box = root.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const out = document.createElement('canvas');
  out.width = Math.round(box.width * dpr);
  out.height = Math.round(box.height * dpr);
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, out.width, out.height);
  root.querySelectorAll('canvas').forEach((c) => {
    const r = c.getBoundingClientRect();
    ctx.drawImage(c, (r.left - box.left) * dpr, (r.top - box.top) * dpr, r.width * dpr, r.height * dpr);
  });
  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = `${name}.png`;
  a.click();
}
