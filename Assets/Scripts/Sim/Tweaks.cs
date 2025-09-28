using UnityEngine;

namespace Sim
{
    /// <summary>
    /// Runtime tweakable parameters for the fluid/foam simulation. These are usually hot-reloaded
    /// via the inspector or debug UI so we keep them as <see cref="ScriptableObject"/> friendly
    /// static fields.
    /// </summary>
    public static class Tweaks
    {
        [Header("Foam Mitosis")]
        [Tooltip("Enable spawning of foam along the air-water interface.")]
        public static bool EnableFoamMitosis = true;

        [Tooltip("Fraction of the current water mass allowed to duplicate into foam each tick.")]
        [Range(0f, 0.05f)]
        public static float FoamSpawnBudgetPct = 0.003f;

        [Tooltip("Per-cell probability that an eligible water cell attempts to split into foam.")]
        [Range(0f, 1f)]
        public static float FoamPSplit = 0.03f;

        [Tooltip("Frames before the same water cell can spawn foam again.")]
        [Range(0, 255)]
        public static int FoamCooldownFrames = 20;

        [Tooltip("Lifetime in frames before foam starts popping with FoamPopProb.")]
        [Range(1, 255)]
        public static int FoamLifetimeFrames = 60;

        [Tooltip("Chance per frame that foam disappears once it reaches the lifetime threshold.")]
        [Range(0f, 1f)]
        public static float FoamPopProb = 0.12f;

        [Tooltip("Chance per frame that foam collapses back into water when directly supported by it.")]
        [Range(0f, 1f)]
        public static float FoamMergeProb = 0.05f;
    }
}
