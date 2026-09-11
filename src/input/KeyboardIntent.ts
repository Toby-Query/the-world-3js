import type { Input } from './Input';
import type { Intent } from '../character/Intent';

/** One-shot actions and the key that triggers each. */
const ACTION_KEYS: Record<string, string> = {
  toggleFlight: 'KeyF',
};

/** Fill `out` from the keyboard, with movement relative to where the camera looks. */
export function readKeyboardIntent(input: Input, cameraYaw: number, out: Intent): void {
  const forward = (input.isDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.isDown('KeyS', 'ArrowDown') ? 1 : 0);
  const right = (input.isDown('KeyD', 'ArrowRight') ? 1 : 0) - (input.isDown('KeyA', 'ArrowLeft') ? 1 : 0);
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  out.move.set(-sin * forward + cos * right, 0, -cos * forward - sin * right);
  if (out.hasMove) out.move.normalize();

  out.sprint = input.isDown('ShiftLeft', 'ShiftRight');
  out.jumpPressed = input.wasPressed('Space');
  out.jumpHeld = input.isDown('Space');
  out.ascend = out.jumpHeld;
  out.descend = input.isDown('KeyC');

  out.actions.clear();
  for (const [action, code] of Object.entries(ACTION_KEYS)) {
    if (input.wasPressed(code)) out.actions.add(action);
  }
}
