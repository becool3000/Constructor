#ifndef COMMON_SHARED_INCLUDED
#define COMMON_SHARED_INCLUDED

static const int2 kCardinals[4] = {
    int2(0, 1),
    int2(1, 0),
    int2(0, -1),
    int2(-1, 0)
};

#define MATERIAL_AIR   0u
#define MATERIAL_WATER 1u
#define MATERIAL_FOAM  2u

cbuffer SimParams : register(b0)
{
    uint2 g_GridSize;          // xy resolution
    uint  g_FrameIndex;        // current frame counter
    uint  g_EnableFoamMitosis; // bool flag packed as uint
    float g_FoamSpawnBudgetPct;
    float g_FoamPSplit;
    uint  g_FoamCooldownFrames;
    uint  g_FoamLifetimeFrames;
    float g_FoamPopProb;
    float g_FoamMergeProb;
}

Texture2D<uint>      GridRead   : register(t0);
RWTexture2D<uint>    GridWrite  : register(u0);
Texture2D<uint>      AuxRead    : register(t1);
RWTexture2D<uint>    AuxWrite   : register(u1);
RWByteAddressBuffer  FoamBudget : register(u2);

// Packed aux layout: [31:16] = age, [15:0] = cooldown.
static const uint AUX_AGE_SHIFT = 16u;
static const uint AUX_AGE_MASK  = 0xFFFF0000u;
static const uint AUX_CD_MASK   = 0x0000FFFFu;

bool InBounds(int2 p)
{
    return all(p >= 0) && p.x < g_GridSize.x && p.y < g_GridSize.y;
}

uint ReadIdR(uint2 p)
{
    return GridRead.Load(int3(p, 0));
}

uint ReadIdW(uint2 p)
{
    return GridWrite[p];
}

void WriteIdW(uint2 p, uint id)
{
    GridWrite[p] = id;
}

uint ReadAuxR(uint2 p)
{
    return AuxRead.Load(int3(p, 0));
}

uint ReadAuxW(uint2 p)
{
    return AuxWrite[p];
}

void WriteAuxW(uint2 p, uint value)
{
    AuxWrite[p] = value;
}

uint GetCooldownR(uint2 p)
{
    return ReadAuxR(p) & AUX_CD_MASK;
}

uint GetCooldownW(uint2 p)
{
    return ReadAuxW(p) & AUX_CD_MASK;
}

void SetCooldownW(uint2 p, uint cooldown)
{
    uint current = ReadAuxW(p);
    uint ageBits = current & AUX_AGE_MASK;
    uint packed = ageBits | (cooldown & AUX_CD_MASK);
    WriteAuxW(p, packed);
}

uint GetAgeR(uint2 p)
{
    return ReadAuxR(p) >> AUX_AGE_SHIFT;
}

uint GetAgeW(uint2 p)
{
    return ReadAuxW(p) >> AUX_AGE_SHIFT;
}

void SetAgeW(uint2 p, uint age)
{
    age = min(age, 0xFFFFu);
    uint current = ReadAuxW(p);
    uint cooldownBits = current & AUX_CD_MASK;
    uint packed = (age << AUX_AGE_SHIFT) | cooldownBits;
    WriteAuxW(p, packed);
}

void CopyThrough(uint2 p)
{
    WriteIdW(p, ReadIdR(p));
    WriteAuxW(p, ReadAuxR(p));
}

uint Hash3(uint x, uint y, uint z)
{
    uint3 v = uint3(x, y, z);
    v ^= v.yzx * 0x9E3779B1u;
    v ^= v.zxy * 0x7F4A7C15u;
    v ^= v.xzy * 0x94D049BBu;
    uint n = v.x ^ v.y ^ v.z;
    n *= 0x7FEB352Du;
    n ^= n >> 15;
    n *= 0x846CA68Bu;
    n ^= n >> 16;
    return n;
}

float Rand01(uint2 p, uint seed)
{
    uint h = Hash3(p.x, p.y, seed);
    return (h & 0x00FFFFFFu) / 16777216.0f;
}

bool IsInterface(uint2 p)
{
    if (ReadIdR(p) != MATERIAL_WATER)
        return false;

    [unroll]
    for (int i = 0; i < 4; ++i)
    {
        int2 q = int2(p) + kCardinals[i];
        if (!InBounds(q))
            continue;
        if (ReadIdR(uint2(q)) == MATERIAL_AIR)
            return true;
    }

    return false;
}

bool TryConsumeFoamBudget()
{
    // Attempt a bounded CAS loop to avoid runaway contention.
    [loop]
    for (uint i = 0u; i < 8u; ++i)
    {
        uint current;
        FoamBudget.InterlockedAdd(0, 0, current);
        if ((int)current <= 0)
            return false;

        uint expected = current;
        uint original;
        FoamBudget.InterlockedCompareExchange(0, expected, current - 1u, original);
        if (original == expected)
            return true;
    }

    return false;
}

#endif // COMMON_SHARED_INCLUDED
