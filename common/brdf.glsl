#pragma once

// type: 0:pbr, 1:unlit(emissive)
const int MAT_PBR = 0;
const int MAT_UNLIT = 1;
struct Material
{
    int type;
    vec3 albedo;
    float metallic;
    float roughness;
};
#define Material() Material(0,vec3(1), 0.5, 0.5)

/*
https://google.github.io/filament/Filament.html#materialsystem
Specular Microfacet BRDF for Realtime Rendering
*/

float pow5(float x)
{
    return (x * x) * (x * x) * x;
}

/*
Normal distribution function
(Trowbridge-Reitz distribution)
*/
float D_GGX(float roughness, float NoH)
{
    float a = NoH * roughness;
    float k = roughness / (1.0 - NoH * NoH + a * a);
    return k * k * (1.0 / PI);
}
/*
Visibility function
(height-correlated Smith function)
*/
float V_Smith(float roughness, float NoV, float NoL)
{
    float a2 = roughness * roughness;
    float G_V = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
    float G_L = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
    return 0.5 / (G_V + G_L);
}
float V_Smith_Fast(float roughness, float NoV, float NoL)
{
    float a = roughness;
    float G_V = NoV / (NoV * (1.0 - a) + a);
    float G_L = NoL / (NoL * (1.0 - a) + a);
    return 0.5 / (G_V + G_L);
}
/*
Fresnel function
(Schlick approximation)
F : Fresnel reflectance
F90 = 1.0
*/
vec3 F_Schlick(vec3 f0, float c)
{
    float k = pow5(1.0 - c);
    return f0 + (1.0 - f0) * k;
}
float F_Schlick_Burley(float f90, float c)
{
    const float f0 = 1.0;
    float k = pow5(1.0 - c);
    return f0 + (f90 - f0) * k;
}
/*
Disney diffuse BRDF
*/
float Fd_Burley(float roughness, float NoV, float NoL, float LoH)
{
    float f90 = 0.5 + 2.0 * roughness * LoH * LoH;
    float ls = F_Schlick_Burley(NoL, f90);
    float vs = F_Schlick_Burley(NoV, f90);
    return ls * vs * (1.0 / PI);
}
/*
Cook-Torrance approximation
Specular-BRDF=D*G*F/(4*dot(L,N)*dot(V,N))
=D*V*F

D: Normal distribution function
G: geometric shadowing function
F: Fresnel function
V: Visibility function
*/
vec3 Microfacet_BRDF(Material mat, vec3 L, vec3 V, vec3 N)
{
    // i think 0.5
    const float reflectance = 0.5;
    vec3 albedo = mat.albedo;
    float metallic = mat.metallic;
    float paramRoughness = mat.roughness;

    float roughness = paramRoughness * paramRoughness;
    // clamp roughness
    roughness = max(roughness, 1e-3);
    vec3 f0 = 0.16 * reflectance * reflectance * (1.0 - metallic) + albedo * metallic;

    vec3 H = normalize(L + V);
    float NoV = abs(dot(N, V)) + 1e-5;
    float NoL = saturate(dot(N, L));
    float NoH = saturate(dot(N, H));
    float LoH = saturate(dot(L, H));

    // Calc specular
    float D_spec = D_GGX(roughness, NoH);
    float V_spec = V_Smith(roughness, NoV, NoL);
    // float V_spec = V_Smith_Fast(roughness, NoV, NoL);

    vec3 F_spec = F_Schlick(f0, LoH);
    vec3 Fr = (D_spec * V_spec) * F_spec;
    // Calc diffuse
    vec3 diffColor = albedo * (1.0 - metallic);
    vec3 Fd = diffColor * Fd_Burley(roughness, NoV, NoL, LoH);

    return (Fr + Fd) * NoL;
}

// Lighting----------------------------------------------

// 1/(r^2+1) * saturate((1-(r/rmax)^2)^2)
void pointLight(vec3 P, vec3 lpos, float lmin, float lmax, out vec3 L, out float lint)
{
    L = lpos - P;
    float r = length(L);
    L /= r;
    r = max(0., r - lmin);
    float c = 1.0 / (r * r + 1.0);
    float w = r / lmax;
    w = 1.0 - w * w;
    w = saturate(w * w);
    lint = c * w;
}
/*
void spotLight(vec3 p, vec3 pos, float rmax, vec3 spotDir, float mintheta, float maxtheta, out vec3 direction, out float intensity)
{
    pointLight(p, pos, rmax, direction, intensity);
    float theta = acos(dot(direction, normalize(spotDir)));
    intensity *= smoothstep(maxtheta, mintheta, theta);
}
*/

void tubeLight(vec3 P, vec3 spos, vec3 epos, float lmin, float lmax, out vec3 L, out float lint)
{
    vec3 dir = epos - spos;
    float len = length(dir);
    dir /= len;
    float t = dot(P - spos, dir);
    t = clamp(t, 0.0, len);
    vec3 p = spos + dir * t;
    pointLight(P, p, lmin, lmax, L, lint);
}