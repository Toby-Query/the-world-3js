import * as THREE from 'three';

/**
 * What a character is trying to do this frame. The keyboard, AI, or the
 * network fills it in; the character never looks at raw keys, so the same
 * Character can be driven by any of them.
 */
export class Intent {
  /** World-space move direction: unit length, or zero for no input. */
  readonly move = new THREE.Vector3();
  sprint = false;
  /** True only on the frame jump went down. Set it back to false to consume the press. */
  jumpPressed = false;
  jumpHeld = false;
  ascend = false;
  descend = false;
  /** One-shot named actions pressed this frame, e.g. 'toggleFlight'. */
  readonly actions = new Set<string>();

  get hasMove(): boolean {
    return this.move.lengthSq() > 0;
  }
}
