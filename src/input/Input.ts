/**
 * Keyboard + mouse state. Call endFrame() once per frame after everything
 * has read input, so per-frame deltas and "pressed this frame" reset.
 *
 * Keys are identified by `KeyboardEvent.code` (e.g. 'KeyW', 'Space',
 * 'ShiftLeft'), which is layout-independent.
 */
export class Input {
  readonly element: HTMLElement;
  mouseDX = 0;
  mouseDY = 0;
  wheel = 0;
  pointerLocked = false;

  private readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();

  constructor(element: HTMLElement) {
    this.element = element;

    window.addEventListener('keydown', (e) => {
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === element;
      if (!this.pointerLocked) this.keys.clear();
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    window.addEventListener(
      'wheel',
      (e) => {
        this.wheel += e.deltaY;
        e.preventDefault();
      },
      { passive: false },
    );
  }

  lockPointer(): void {
    Promise.resolve(this.element.requestPointerLock?.()).catch(() => {});
  }

  /** True if any of the given keys is currently held. */
  isDown(...codes: string[]): boolean {
    return codes.some((c) => this.keys.has(c));
  }

  /** True only on the frame the key went down. */
  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  endFrame(): void {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
  }
}
