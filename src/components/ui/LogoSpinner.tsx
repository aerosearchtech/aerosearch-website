import Logo from "./Logo";

/**
 * Loading state for the WebGL scenes.
 *
 * The mark is a rotorcraft seen from above, so it turns rather than pulses or
 * fades — the motion belongs to the object instead of being applied to it.
 *
 * It is mark blue, the same as the lockup in the header and the footer. That is
 * the only hue in the palette with no field meaning, which is exactly what a
 * loading state needs: waiting is not hazard, not survey, not cleared ground.
 *
 * Held back a quarter-second before appearing, since on a fast connection a
 * loader that flashes reads as jank rather than as progress.
 */
export default function LogoSpinner() {
  return (
    <div className="flex h-full w-full animate-hold-in items-center justify-center">
      <Logo className="h-10 w-10 animate-rotor text-mark motion-reduce:animate-none" />
    </div>
  );
}
