using UnityEngine;

namespace Sim
{
    /// <summary>
    /// Helper that uploads tweakable parameters to the compute shaders each frame.
    /// This is a minimal stub so that the new foam parameters have a clearly defined
    /// location even when the rest of the project is omitted in this kata repository.
    /// </summary>
    public class SimBindings : MonoBehaviour
    {
        [System.Serializable]
        public struct FoamParams
        {
            public uint EnableFoamMitosis;
            public float FoamSpawnBudgetPct;
            public float FoamPSplit;
            public int FoamCooldownFrames;
            public int FoamLifetimeFrames;
            public float FoamPopProb;
            public float FoamMergeProb;
            public uint FoamBudget;
        }

        public ComputeShader fluidPass;
        public ComputeShader foamPass;

        private FoamParams _cached;
        private uint _frameIndex;

        private static uint BoolToUInt(bool value) => value ? 1u : 0u;

        private void LateUpdate()
        {
            _frameIndex++;
            UpdateParams();
        }

        private void UpdateParams()
        {
            _cached.EnableFoamMitosis = BoolToUInt(Tweaks.EnableFoamMitosis);
            _cached.FoamSpawnBudgetPct = Tweaks.FoamSpawnBudgetPct;
            _cached.FoamPSplit = Tweaks.FoamPSplit;
            _cached.FoamCooldownFrames = Tweaks.FoamCooldownFrames;
            _cached.FoamLifetimeFrames = Tweaks.FoamLifetimeFrames;
            _cached.FoamPopProb = Tweaks.FoamPopProb;
            _cached.FoamMergeProb = Tweaks.FoamMergeProb;
        }

        /// <summary>
        /// Called by the simulation loop to bind the parameters and per-frame budget to the shaders.
        /// </summary>
        public void BindFoamParams(uint foamBudget)
        {
            _cached.FoamBudget = foamBudget;

            if (fluidPass != null)
            {
                fluidPass.SetBool("g_EnableFoamMitosis", Tweaks.EnableFoamMitosis);
                fluidPass.SetFloat("g_FoamSpawnBudgetPct", Tweaks.FoamSpawnBudgetPct);
                fluidPass.SetFloat("g_FoamPSplit", Tweaks.FoamPSplit);
                fluidPass.SetInt("g_FoamCooldownFrames", Tweaks.FoamCooldownFrames);
                fluidPass.SetInt("g_FoamLifetimeFrames", Tweaks.FoamLifetimeFrames);
                fluidPass.SetFloat("g_FoamPopProb", Tweaks.FoamPopProb);
                fluidPass.SetFloat("g_FoamMergeProb", Tweaks.FoamMergeProb);
                fluidPass.SetInt("g_FrameIndex", unchecked((int)_frameIndex));
                fluidPass.SetInt("g_FoamBudget", unchecked((int)foamBudget));
            }

            if (foamPass != null)
            {
                foamPass.SetBool("g_EnableFoamMitosis", Tweaks.EnableFoamMitosis);
                foamPass.SetFloat("g_FoamSpawnBudgetPct", Tweaks.FoamSpawnBudgetPct);
                foamPass.SetFloat("g_FoamPSplit", Tweaks.FoamPSplit);
                foamPass.SetInt("g_FoamCooldownFrames", Tweaks.FoamCooldownFrames);
                foamPass.SetInt("g_FoamLifetimeFrames", Tweaks.FoamLifetimeFrames);
                foamPass.SetFloat("g_FoamPopProb", Tweaks.FoamPopProb);
                foamPass.SetFloat("g_FoamMergeProb", Tweaks.FoamMergeProb);
                foamPass.SetInt("g_FrameIndex", unchecked((int)_frameIndex));
                foamPass.SetInt("g_FoamBudget", unchecked((int)foamBudget));
            }
        }
    }
}
