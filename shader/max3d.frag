#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"
#pragma include "common/brdf.glsl"
#pragma include "common/sdf.glsl"
#pragma include "common/noise.glsl"
#pragma include "common/shape2d.glsl"

// Global----------------------------------------------------------------------------------
#define LoopMax 256
#define DistMin 1e-3
#define LenMax 100.0
#define NormalEPS 1e-4

float Time;
int MatID;

const float RZ = 2.0;
#define IEEI (beatCount+(phaseCount == 3?pass_index:0))

// Other----------------------------------------------------------------------------------
struct Info
{
    float pd;
    float magaru;
    float mawaru;
    float tikaru;
};

Info getInfo()
{
    Info info;
    int iei = phaseCount > 2 ? IEEI / 2 : IEEI;
    vec3 h3 = pcg33(vec3(iei, -.11, 12.2));
    info.pd = floor(h3.x * mix(2.0, 4.0, phaseGain)) + 2.0;
    info.magaru = float(h3.y < 0.5);
    info.mawaru = mix(0.01, 0.1, float(h3.z < 0.5));
    h3 = pcg33(vec3(iei, 21.23, -1.4));
    info.tikaru = float(h3.x < 0.5);
    return info;
}

// SDF----------------------------------------------------------------------------------

float sdPol(vec3 p)
{
    const vec2 syz = vec2(2, 0.9);
    const float r = 4.0;
    float rz = RZ;
    Info info = getInfo();
    float zi = floor(p.z / rz) * rz;
    p.z = mod(p.z, rz) - rz * 0.5;
    float a = TAU * zi * info.mawaru;
    p.xy *= rot(-a);
    p.xy = pmod(p.xy, info.pd);
    p.y -= r;
    p.y += -p.x * p.x * 0.05 * info.magaru;
    return sdBox(p, vec3(1e5, syz * 0.5));
}

float sdPolLight(vec3 p)
{
    const float sr = 0.3;
    const float r = 2.0;
    float rz = RZ * 2.0;
    Info info = getInfo();
    float zi = floor(p.z / rz) * rz;
    p.z = mod(p.z, rz) - rz * 0.5;
    float a = TAU * zi * info.mawaru;
    p.xy *= rot(-a);
    p.xy = pmod(p.xy, info.pd);
    p.y -= r;
    p.y += -p.x * p.x * 0.05 * info.magaru;
    // return sdBox(p, vec3(1e9, syz * 0.5));
    return sdCapsule(p, vec3(-1e5, 0, 0), vec3(1e5, 0, 0), sr);
}

float sdf(vec3 p)
{
    #define opSDFMin(sdf) (MatID = ((dt = sdf) < d ? (d = dt, mid): MatID)), mid++
    int mid = 0;
    MatID = -1;
    float dt, d = LenMax;

    opSDFMin(sdPol(p));
    opSDFMin(sdPolLight(p));

    return d;
}

vec3 getNormal(vec3 p)
{
    const float h = NormalEPS;
    const vec2 k = vec2(1, -1);
    // keep matid
    int mid = MatID;
    vec3 n = normalize(k.xyy * sdf(p + k.xyy * h) + k.yyx * sdf(p + k.yyx * h) + k.yxy * sdf(p + k.yxy * h) + k.xxx * sdf(p + k.xxx * h));
    MatID = mid;
    return n;
}

vec3 getPolLightDir(vec3 p)
{
    const float h = NormalEPS;
    const vec2 k = vec2(1, -1);
    vec3 l = -normalize(k.xyy * sdPolLight(p + k.xyy * h) + k.yyx * sdPolLight(p + k.yyx * h) + k.yxy * sdPolLight(p + k.yxy * h) + k.xxx * sdPolLight(p + k.xxx * h));
    return l;
}

bool march(vec3 rd, vec3 ro, out vec3 rp)
{
    float dist, len = 0.0;
    for(int i; i < LoopMax; i++)
    {
        rp = ro + rd * len;
        dist = sdf(rp);
        // traversal z
        float nd = abs((ceil(rp.z / RZ) * RZ - rp.z));
        nd = (rd.z < 0.0 ? nd - RZ : nd) / rd.z;
        dist = min(dist, nd + DistMin);

        len += dist;
        if(len > LenMax)
        {
            break;
        }
        if(dist < DistMin)
        {
            return true;
        }
    }
    return false;
}

// Material----------------------------------------------------------------------------------
#define Tika(P) float(fract(floor(P.z / RZ - Time * 10.0) / 6.0) < 0.1||getInfo().tikaru>0.5)

Material getMaterial(vec3 P, inout vec3 N)
{
    Material mat = Material();
    if(MatID == 0)
    {
        P.z = mod(P.z, RZ);
        vec2 uv = uvtrip(P, N, 20.0);
        float c = concrete(uv);
        mat.albedo = vec3(c);
        mat.roughness = 0.7;
        mat.metallic = 0.2;
    }
    else if(MatID == 1)
    {
        mat.albedo = vec3(1) * Tika(P);
        mat.type = MAT_UNLIT;
    }
    return mat;
}

// Shading----------------------------------------------------------------------------------

vec3 calcDirectionalLight(Material mat, vec3 P, vec3 V, vec3 N)
{
    vec3 L = normalize(vec3(-P.xy, 1));
    vec3 lcol = vec3(0.5);
    return Microfacet_BRDF(mat, L, V, N) * lcol;
}

vec3 calcPolLight(Material mat, vec3 P, vec3 V, vec3 N)
{
    float d = sdPolLight(P);
    vec3 L = getPolLightDir(P);
    vec3 lcol = vec3(2);
    vec3 lpos = P + L * d;
    float lint;
    pointLight(P, lpos, 1.5, 4.0, L, lint);
    return Microfacet_BRDF(mat, L, V, N) * lcol * lint * Tika(lpos);
}

vec3 secondaryShading(vec3 SP, vec3 SV)
{
    vec3 scol = vec3(0);
    vec3 SN = getNormal(SP);
    Material smat = getMaterial(SP, SN);
    return smat.albedo * float(smat.type == MAT_UNLIT);
}

vec3 shading(inout vec3 P, vec3 V, vec3 N)
{
    vec3 col = vec3(0);
    N = getNormal(P);

    Material mat = getMaterial(P, N);
    if(mat.type == MAT_UNLIT)
    {
        return mat.albedo;
    }
    // primary lighting
    col += calcDirectionalLight(mat, P, V, N);
    col += calcPolLight(mat, P, V, N);

    // secondary ray
    P += N * DistMin;// avoid self-intersection
    vec3 SP;
    vec3 srd = reflect(-V, N);
    if(!march(srd, P, SP))
    {
        return col;
    }
    vec3 SV = -srd;
    vec3 scol = secondaryShading(SP, SV);

    // primary lighting
    // indirect like IBL
    const float iblmax = 10.0;
    float iblr = length(SP - P);
    // saturate((1-(r/rmax)^2)^2)
    float iblwin = saturate(pow(saturate(1.0 - pow(iblr / iblmax, 2.0)), 2.0));
    col += scol * Microfacet_BRDF(mat, srd, V, N) / PI;

    return col;
}

// Trace----------------------------------------------------------------------------------

// primary ray
vec3 tracer(vec3 rd, vec3 ro)
{
    vec3 rp;
    if(!march(rd, ro, rp))
    {
        return vec3(0);// sky color
    }
    float len = length(rp - ro);
    vec3 N;
    vec3 col = shading(rp, -rd, N);

    // fog
    float fog = exp(-max(0.0, len * 0.03));

    col *= fog;
    return col;
}

// Root----------------------------------------------------------------------------------

float sEyeCustom(vec2 uv, float t)
{
    const float sc = 0.8;
    // float lt = t * 5.0;
    // float h1 = pcg11(floor(lt));
    // float ease = fract(lt);
    // float mabataki = pow(abs(ease - 0.5) * 2.0, 7.0);
    // float w = 0.4 * (h1 < 0.05 ? mabataki : 1.0);
    float w = 0.4 * saturate(t);
    uv = (uv - .5) / sc + .5;
    vec2 suv = uv * 2.0 - 1.0;
    suv.y = abs(suv.y);
    float x = suv.x, y = suv.y;
    float right = w * (1.0 - x * x);
    right *= pow(1.0 - saturate(abs(x)), 0.2);

    float c = 0.0;
    c += float(y < right);
    // c -= sCircle(uv, w * 0.45);

    return saturate(c);
}

void getUV(out vec2 uv, out vec2 suv)
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    uv = fc / res;
    suv = (fc * 2.0 - res) / min(res.x, res.y);

    vec2 euv = uvmap(suv * rot(-PI * 0.25), vec2(-1.5), vec2(1.5));
    float c = sEyeCustom(euv, 1.0 - pow(1.0 / (1.0 + beatBT.y), 10.0));
    if(IsEye)
    {
        suv += cyclic(vec3(suv * 0.1, Time * 0.005)).xy * c * 0.2;
    }
}

void getRORD(out vec3 ro, out vec3 rd, out vec3 dir, vec2 suv)
{
    // Parameter
    float fov = 60.0;
    float fisheye = 0.0;
    // 0.0: ortho, 1.0: persp
    float pars = 1.0;
    // ortho size
    float osize = 2.5;
    // ortho near
    float onear = -5.0;

    ro = vec3(0, 0, Time);
    dir = vec3(0, 0, 1);

    mat3 bnt = getBNT(dir);
    float zf = 1.0 / tan(fov * PI / 360.0);
    zf -= zf * length(suv) * fisheye;

    vec3 rdp, rop, rdo, roo;
    {
        rdp = normalize(bnt * vec3(suv, zf));
        rop = ro;
    }
    {
        rdo = dir;
        roo += bnt * vec3(suv * osize, onear);
    }

    rd = normalize(mix(rdo, rdp, pars));
    ro = mix(roo, rop, pars);
}

vec3 overlay(vec3 ro, vec2 uv, vec2 suv, vec3 bcol)
{
    vec3 col = vec3(0);

    float c = 0.0;
    Info info = getInfo();

    vec2 puv = suv;
    puv *= rot(-(ro.z + 2.0) * TAU * 0.01);

    puv = pmod(puv, info.pd);
    puv.y += -puv.x * puv.x * info.magaru;
    float fq = 7.0;
    float l = abs(fract(puv.y * fq) - 0.5) * 2.0;
    c += smoothstep(0.5, 0.45, l) * float(floor(puv.y * fq) < 5.0);

    col += c;
    return col;
}

vec3 postProcess(vec3 col, vec2 uv, vec2 suv)
{
    // Vignette
    float l = length(uv * 2.0 - 1.0);
    l = remapc(l, 0.5, 1.0, 1.0, 0.0);
    col *= (mix(0.7, 1.0, smoothstep(0.0, 1.0, l)));
    return col;
}

// Main----------------------------------------------------------------------------------

vec3 render(float t)
{
    // Parameter
    Time = t;

    // Get UV
    vec2 uv, suv;
    getUV(uv, suv);

    // Camera
    vec3 ro, rd, dir;
    getRORD(ro, rd, dir, suv);

    // Tracer
    vec3 col = tracer(rd, ro);

    // Overlay
    if(IEEI % 2 == 0 && phaseCount > 2)
    {
        col = overlay(ro, uv, suv, col);
    }

    // Post Process
    col = postProcess(col, uv, suv);

    vec2 euv = uvmap(suv * rot(-PI * 0.25), vec2(-1.5), vec2(1.5));
    float c = sEyeCustom(euv, 1.0 - pow(1.0 / (1.0 + beatBT.y), 10.0));
    if(IsEye && c < 0.5)
    {
        col *= vec3(1, 0.1, 0.1);
    }

    return col;
}

void main()
{
    // Render
    vec3 col = render(time);
    // Output to screen
    outColor = vec4(col, 1);
}