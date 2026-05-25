/**
 * Portal version metadata — shown as a small pill near the dashboard
 * header so Suneet / Mike can tell at a glance which build a tester is
 * looking at.
 *
 * Naming convention: SemVer for the version number, and a fruit codename
 * that increments alphabetically on each MINOR bump. Patches (x.y.PATCH)
 * keep the same fruit; only minor (x.MINOR.0) ticks the codename forward.
 *
 *   Past:    [N] Nectarine — 4.2.x
 *   Future:  [O] Orange, [P] Peach, [Q] Quince, [R] Raspberry,
 *            [S] Strawberry, [T] Tangerine, [U] Ugli, [V] ...
 *
 * Bump RELEASED on every deploy, even patches. Easier to spot whether the
 * tester is on yesterday's build vs. an hour-old one.
 */

export const VERSION = "4.2.2";
export const CODENAME = "Nectarine";
export const RELEASED = "2026-05-25";

// Convenience: full label for the pill. Computed here so the dashboard
// doesn't have to know about the formatting.
export const VERSION_LABEL = `v${VERSION} (${CODENAME})`;
