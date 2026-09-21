/** Minimal binary min-heap over (priority, payload) number pairs. */
export class MinHeap {
  private pri: number[] = [];
  private val: number[] = [];

  get size(): number {
    return this.pri.length;
  }

  push(priority: number, value: number): void {
    this.pri.push(priority);
    this.val.push(value);
    let i = this.pri.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.pri[p] <= this.pri[i]) break;
      this.swap(i, p);
      i = p;
    }
  }

  pop(): number {
    const top = this.val[0];
    const lastP = this.pri.pop() as number;
    const lastV = this.val.pop() as number;
    if (this.pri.length) {
      this.pri[0] = lastP;
      this.val[0] = lastV;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.pri.length && this.pri[l] < this.pri[m]) m = l;
        if (r < this.pri.length && this.pri[r] < this.pri[m]) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    [this.pri[a], this.pri[b]] = [this.pri[b], this.pri[a]];
    [this.val[a], this.val[b]] = [this.val[b], this.val[a]];
  }
}
