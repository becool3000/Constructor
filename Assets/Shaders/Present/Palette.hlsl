#ifndef PALETTE_INCLUDED
#define PALETTE_INCLUDED

#define MATERIAL_AIR   0u
#define MATERIAL_WATER 1u
#define MATERIAL_FOAM  2u

float3 PaletteLookup(uint id)
{
    const float3 water = float3(0.22, 0.45, 0.95);
    const float3 foam = lerp(water, float3(1.0, 1.0, 1.0), 0.35);

    if (id == MATERIAL_AIR)
        return float3(0.0, 0.0, 0.0);
    if (id == MATERIAL_WATER)
        return water;
    if (id == MATERIAL_FOAM)
        return foam;

    return float3(1.0, 0.0, 1.0);
}

#endif // PALETTE_INCLUDED
