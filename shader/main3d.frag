#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"
#pragma include "common/brdf.glsl"
#pragma include "common/sdf.glsl"
#pragma include "common/noise.glsl"

// Global----------------------------------------------------------------------------------
#define LoopMax 256
#define DistMin 1e-3
#define LenMax 100.0
#define NormalEPS 1e-4

float Time;
int MatID;
float Depth;

const vec3 RoomSize = vec3(4, 4, 100);
// Other----------------------------------------------------------------------------------

// SDF----------------------------------------------------------------------------------

float sdTest(vec3 p)
{
    return min(sdSphere(p - vec3(0, -2, 0), 1.), -sdBox(p, vec3(2, 2, 1e9)));
}

float sdConcrete(vec3 p)
{
    const float cs = 0.8;
    const float cl = 0.015;
    const float cr = 0.03;
    const float ch = 0.0;
    vec3 q = p;
    // fold
    q.xy = abs(q.xy);
    q.xy = fold(q.xy, PI * .75);
    // 盛り上がり
    q.y += -(RoomSize.y + cs) * 0.5 + cl + ch;
    q.xz = mod(q.xz + cs * 0.5, cs) - 0.5 * cs;
    float d = sdBox(q, vec3(cs * 0.5 - cl)) - cr;
    // くぼみ
    q.xz = abs(q.xz) - cs * 0.5 * 0.5;
    q.y += cs * 0.5 + cr;
    d = max(d, -sdCappedCylinder(q, 0.06, 0.03));

    // room
    d = min(d, -sdBox(p, RoomSize * 0.5));
    return d;
}

float sdHashira(vec3 p)
{
    const float s = 0.1;
    const float z = 1.0;

    float d = sdBox(p - vec3(-RoomSize.x * 0.5 + 0.5, 0, 0), vec3(s, RoomSize.y * 0.5, s)) - 0.01;
    p.z = mod(p.z + z * 0.5, z) - z * 0.5;
    d = min(d, sdBox(p - vec3(RoomSize.x * 0.5 - 0.5, 0, 0), vec3(s, RoomSize.y * 0.5, s)) - 0.01);
    return d;
}

float sdHashiraBox(vec3 p)
{
    return sdBox(p - vec3(-RoomSize.x * 0.5 + 0.5, 0.5, 0), vec3(0.5));
}

struct Annai
{
    float zi;
    float h;
    float cav;
    float waku;
    vec3 size;
};
Annai getAnnai(inout vec3 p)
{
    Annai a;
    // l*2個出て、間隔はc
    const float c = 4.0, l = 2.0;
    p.z += c * 0.5;
    a.zi = opRepLimID(p.z, c, l);
    p.z = opRepLim(p.z, c, l);

    vec3 h3 = pcg33(vec3(a.zi, 1.2, -.42 + beatBT.w));

    // TODO shape random
    a.h = mix(0.1, 2.0, h3.x);
    a.cav = 0.01;
    a.waku = 0.05;
    a.size = vec3(mix(1.0, 2.0, h3.y), mix(0.5, 0.75, h3.z), 0.1);

    h3 = pcg33(h3.yzx + 45.42);
    float sx = RoomSize.x * 0.5 - a.size.x * 0.5;
    p.x += mix(-sx, sx, h3.x);
    return a;
}
float sdAnnaiWaku(vec3 p)
{
    const float r = 0.01;
    const float pad = 0.1;

    Annai a = getAnnai(p);
    float h = a.h;
    float cav = a.cav;
    float waku = a.waku;
    vec3 size = a.size;

    p.y -= RoomSize.y * 0.5 - h;
    vec3 q = p;
    q.x = abs(q.x) - size.x * 0.5 + pad;
    float d = sdVerticalCapsule(q, h, r);
    p -= vec3(0, -size.y * 0.5, 0);
    d = min(d, sdBox(p, size * 0.5));
    q = p;
    q.z = abs(q.z) - size.z * 0.5;
    d = max(d, -sdBox(q, vec3(size.xy * 0.5 - waku, cav * 2.0)));
    return d;
}
float sdAnnai(vec3 p)
{
    Annai a = getAnnai(p);
    float h = a.h;
    float cav = a.cav;
    float waku = a.waku;
    vec3 size = a.size;

    p.y -= RoomSize.y * 0.5 - h;
    p -= vec3(0, -size.y * 0.5, 0);
    p.z = abs(p.z) - size.z * 0.5 + cav;
    float d = sdQuad(p, vec2(size.xy * 0.5 - waku));
    return d;
}
float sdKeikoutou(vec3 p)
{
    p.x += RoomSize.x * 0.5;
    p.z = mod(p.z, 4.0) - 2.0;
    p.z = abs(p.z) - 0.5;
    p.y -= -RoomSize.y * 0.5 + 0.5;
    float d = sdBox(p, vec3(0.1, 0.05, 0.025));
    return d;
}
float sdKeikoutouLight(vec3 p)
{
    p.x += RoomSize.x * 0.5 - 0.05;
    p.z = mod(p.z, 4.0) - 2.0;
    p.y -= -RoomSize.y * 0.5 + 0.5;
    float d = sdCapsule(p, vec3(0, 0, -0.5), vec3(0, 0, 0.5), 0.025);
    return d;
}

float sdf(vec3 p)
{
    #define opSDFMin(sdf) (MatID = ((dt = sdf) < d ? (d = dt, mid): MatID)), mid++
    int mid = 0;
    MatID = -1;
    float dt, d = LenMax;

    opSDFMin(sdConcrete(p));
    opSDFMin(sdHashira(p));
    opSDFMin(sdHashiraBox(p));
    opSDFMin(sdAnnaiWaku(p));
    opSDFMin(sdAnnai(p));
    opSDFMin(sdKeikoutou(p));
    opSDFMin(sdKeikoutouLight(p));

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

bool march(vec3 rd, vec3 ro, out vec3 rp)
{
    float dist, len = 0.0;
    for(int i; i < LoopMax; i++)
    {
        rp = ro + rd * len;
        dist = sdf(rp);
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

Material matConcrete(vec3 P, inout vec3 N)
{
    Material mat = Material();

    vec2 uv = uvtrip(P * 2.0, N);
    mat.albedo = vec3(1) * concrete(uv);

    const float dryrough = 0.8, wetrough = 0.2;
    const float drymetal = 0.1, wetmetal = 0.9;
    float f2w = 1.0;
    float h = smoothstep(-RoomSize.y * 0.5, -RoomSize.y * 0.5 + f2w, P.y);
    float waterint = 0.6;
    float w2d = smoothstep(waterint - 0.05, waterint + 0.05, fbm12(uv) * 0.5 + 0.5);

    mat.roughness = mix(mix(wetrough, dryrough, w2d), dryrough, h);
    mat.metallic = mix(mix(wetmetal, drymetal, w2d), drymetal, h);
    N = normalize(N + cyclic(P) * mix(0.1, 0.0, h));// nmap

    return mat;
}

Material matAnnai(vec3 P, inout vec3 N)
{
    Material mat = Material();
    mat.type = MAT_UNLIT;

    Annai a = getAnnai(P);
    float h = a.h;
    float cav = a.cav;
    float waku = a.waku;
    vec3 size = a.size;

    P.y -= RoomSize.y * 0.5 - h;
    P -= vec3(0, -size.y * 0.5, 0);
    P.z = abs(P.z) - size.z * 0.5 + cav;
    vec2 wh = size.xy * 0.5 - waku;
    vec2 uv = remapc(P.xy, -wh, wh, vec2(0), vec2(1));

    vec3 col = vec3(0);
    if(phaseCount < 6)
    {
        col = texture(FlyerTex, fract(uv * wh / max(wh.x, wh.y))).rgb;
    }
    else
    {
        vec3 h3 = pcg33(vec3(a.zi, 1.2, -.42 + beatCount));
        vec2 suv = (uv - 0.5) * wh / max(wh.x, wh.y);
        vec2 uva = fract(uv * wh / max(wh.x, wh.y));
        vec2 uvs = fract(suv / (vec2(1280, 360) / 1280.0) * 0.7 + 0.5);
        // FlyerTex,SideTekitouTex,Max3DSideTex,SnowTex,Main3DSideTex
        if(h3.z < 0.2)
        {
            col = texture(FlyerTex, uva).rgb;
        }
        else if(h3.z < 0.4)
        {
            col = texture(SideTekitouTex, uvs).rgb;
        }
        else if(h3.z < 0.6)
        {
            col = texture(Max3DSideTex, uvs).rgb;
        }
        else if(h3.z < 0.8)
        {
            col = texture(SnowTex, uvs).rgb * 0.5;
        }
        else
        {
            col = texture(Main3DSideTex, uvs).rgb;
        }
    }
    mat.albedo = col;

    return mat;
}

Material matHashiraBox(vec3 P, inout vec3 N)
{
    Material mat = Material();
    mat.type = MAT_UNLIT;

    P -= vec3(-RoomSize.x * 0.5 + 0.5, 0.5, 0);

    vec2 uv = uvtrip(P, N);
    uv = remap(uv + .5, vec2(0), vec2(1), vec2(0), vec2(1));
    // TODO: uvを補正する
    uv = 1.1 * (uv - 0.5) + 0.5;
    // flyer
    vec3 col = texture(FlyerTex, uv).rgb;
    mat.albedo = col;

    // 端を暗く
    if(!inuv(uv))
    {
        // mat.type = MAT_PBR;
        mat.albedo = vec3(0);
        // mat.metallic = 0.9;
        // mat.roughness = 0.2;
    }

    return mat;
}

Material getMaterial(vec3 P, inout vec3 N)
{
    Material mat = Material();

    // mat.type = MAT_UNLIT;
    // mat.albedo = pcg33(vec3(MatID));
    // return mat;

    if(MatID == 2)
    {
        mat = matHashiraBox(P, N);
    }
    // else if(MatID == 3)
    // {
    //     mat.metallic = 0.9;
    //     mat.roughness = 0.2;
    // }
    else if(MatID == 6)
    {
        mat.type = MAT_UNLIT;
        mat.albedo = (IsEye ? vec3(1, 0.1, 0.1) : vec3(1));
    }
    else if(MatID == 4)
    {
        mat = matAnnai(P, N);
    }
    else
    {
        mat = matConcrete(P, N);
    }
    return mat;
}

// Shading----------------------------------------------------------------------------------
float calcAO(vec3 P, vec3 N)
{
    return saturate(sdf(P + N * 0.1) / 0.1);
}
vec3 calcBoxLight(Material mat, vec3 P, vec3 V, vec3 N)
{
    vec3 col = vec3(0);
    vec3 L = vec3(0);
    vec3 lpos = vec3(0);
    vec3 lcol = vec3(0);

    // some light
    lpos = vec3(-RoomSize.x * 0.5 + 0.5, 0.5, 0);
    float lint;
    pointLight(P, lpos, 2., 10., L, lint);
    lcol = IsEye ? vec3(1, 0.1, 0.1) : hex2rgb(0xF5DB0C);
    col += Microfacet_BRDF(mat, L, V, N) * lcol * lint;

    return col;
}

vec3 calcKeikoutou(Material mat, vec3 P, vec3 V, vec3 N)
{
    vec3 col = vec3(0);
    vec3 L = vec3(0);
    vec3 lcol = (IsEye ? vec3(1, 0.1, 0.1) : vec3(1));

    float lint;
    const float lmin = 1.0, lmax = 6.0;
    P.z = mod(P.z, 4.0) - 2.0;

    vec3 spos = vec3(-RoomSize.x * 0.5 + 0.1, -RoomSize.y * 0.5 + 0.5, -0.5);
    vec3 epos = vec3(-RoomSize.x * 0.5 + 0.1, -RoomSize.y * 0.5 + 0.5, 0.5);
    tubeLight(P, spos, epos, lmin, lmax, L, lint);
    col += lcol * lint * Microfacet_BRDF(mat, L, V, N);
    tubeLight(P - vec3(0, 0, 4), spos, epos, lmin, lmax, L, lint);
    col += lcol * lint * Microfacet_BRDF(mat, L, V, N);
    tubeLight(P + vec3(0, 0, 4), spos, epos, lmin, lmax, L, lint);
    col += lcol * lint * Microfacet_BRDF(mat, L, V, N);

    return col;
}

vec3 secondaryShading(vec3 SP, vec3 SV)
{
    vec3 scol = vec3(0);
    vec3 SN = getNormal(SP);
    Material smat = getMaterial(SP, SN);
    return smat.albedo * float(smat.type == MAT_UNLIT);

    // do not! too bright!
    // secondary lighting

    // return scol;
}

vec3 shading(vec3 P, vec3 V, out vec3 N)
{
    vec3 col = vec3(0);
    N = getNormal(P);

    Material mat = getMaterial(P, N);
    if(mat.type == MAT_UNLIT)
    {
        return mat.albedo;
    }
    // primary lighting
    col += calcBoxLight(mat, P, V, N);
    col += calcKeikoutou(mat, P, V, N);

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
    // WTF
    col += scol * Microfacet_BRDF(mat, normalize(srd + N * 0.2), V, N) / PI;

    return col;
}

// Trace----------------------------------------------------------------------------------

// primary ray
vec3 tracer(vec3 rd, vec3 ro)
{
    Depth = LenMax;
    vec3 rp;
    if(!march(rd, ro, rp))
    {
        return vec3(0);// sky color
    }

    vec3 N;
    vec3 col = shading(rp, -rd, N);

    // fog
    float len = length(rp - ro);
    Depth = len;
    float fog = exp(-max(0.0, len * 0.1 - 15.0));

    // ao
    float ao = calcAO(rp + N * 0.1, N);
    // ao = 1.0;

    col *= fog * ao;
    return col;
}

// Root----------------------------------------------------------------------------------

void getUV(out vec2 uv, out vec2 suv)
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    uv = fc / res;
    // suv = (fc * 2.0 - res) / min(res.x, res.y);
    suv = (uv * 2.0 - 1.0) * res / min(res.x, res.y);
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

    // target
    vec3 ta = vec3(0, 0, 0);

    ro = vec3(0, 0, -12);
    ta = vec3(0, 0, 0);

    vec3 flycenter = vec3(-RoomSize.x * 0.5 + 0.5, 0.5, 0);
    if(phaseCount < 5)
    {
        ro = vec3(flycenter.xy + vec2(1, -0.5), -1.0);
        ta = flycenter + vec3(0.2, 0, 0);
    }
    else if(phaseCount > 5)
    {
        int cameraID = cameraCount % 4;
        if(cameraID == 0)
        {
            ro = vec3(0, 0, -12);
            ta = vec3(0, 0, 0);
        }
        else if(cameraID == 1)
        {
            fov = 90.0;
            ro = vec3(0, -1.5, -15 + cameraBT.y * 0.5);
            ta = ro + vec3(-0.5, -0.25, 1);
        }
        else if(cameraID == 2)
        {
            fov = 90.0;
            fisheye = 0.5;
            ro = vec3(1.8, 1.5 * sin(cameraBT.y * 0.1), 1.5);
            ta = flycenter;
        }
        else
        {
            fov = 90.0;
            fisheye = 0.7;
            ro = vec3(0, 1.51, 0);
            ta = flycenter;
        }
    }

    dir = normalize(ta - ro);
    // add tebure
    vec3 dw0, dw1;
    const float dwfreq = 0.01, dwamp = 0.15;
    float dw = domainWarping(vec3(.4, -1.2, AbsTime * dwfreq), dw0, dw1);
    ro += dw1 * dwamp;

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

    // Post Process
    col = postProcess(col, uv, suv);
    col = clamp(col, 0.0, 2.0);

    return col;
}

void main()
{
    // Render
    vec3 col = render(time);
    // Output to screen
    outColor = vec4(col, Depth);
}