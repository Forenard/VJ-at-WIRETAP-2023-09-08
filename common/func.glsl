#pragma once

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;

#define remap(x,a,b,c,d) ((((x)-(a))/((b)-(a)))*((d)-(c))+(c))
#define remapc(x,a,b,c,d) clamp(remap(x,a,b,c,d),min(c,d),max(c,d))
#define saturate(x) clamp(x,0.0,1.0)
#define linearstep(a, b, x) min(max(((x) - (a)) / ((b) - (a)), 0.0), 1.0)

float cross2(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

vec2 uvmap(vec2 uv, vec2 lb, vec2 rt)
{
    return (uv - lb) / (rt - lb);
}
vec2 uvmapc(vec2 uv, vec2 lb, vec2 rt)
{
    return clamp(uvmap(uv, lb, rt), 0., 1.);
}
vec2 uvmap(vec2 uv, vec2 lb, vec2 rb, vec2 lt, vec2 rt)
{
    float c0 = cross2(uv - lb, lt - lb);
    float c1 = cross2(uv - lt, rt - lt);
    float c2 = cross2(uv - rt, rb - rt);
    float c3 = cross2(uv - rb, lb - rb);
    return vec2(c0 / (c0 + c2), c3 / (c1 + c3));
}
bool inuv(vec2 uv)
{
    return all(greaterThanEqual(uv, vec2(0)) && lessThan(uv, vec2(1)));
}

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

float _tri(float x, float c)
{
    return (x < c ? x / c : 1. - (x - c) / (1. - c));
}
// 等色関数0
vec3 cloma0(float x)
{
    x = fract(x);
    return vec3(_tri(x, .7), _tri(x, .5), _tri(x, .2)) * 2.;
}
// 等色関数1
vec3 cloma1(float x)
{
    return (.5 + .5 * cos(TAU * (x + vec3(0, 1, 2) / 3.))) * 2.;
}

float rgb2gray(vec3 rgb)
{
    return dot(rgb, vec3(0.299, 0.587, 0.114));
}

vec3 acesFilm(vec3 x)
{
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 hex2rgb(uint hex)
{
    return vec3((hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff) / 255.;
}

// ortho basis
// https://en.wikipedia.org/wiki/Osculating_plane
mat3 getBNT(vec3 T)
{
    // camera rotation (may not be needed)
    // float cr = 0.0;
    // vec3 N = vec3(sin(cr), cos(cr), 0.0);
    T = normalize(T);
    vec3 N = vec3(0, 1, 0);
    vec3 B = normalize(cross(N, T));
    N = normalize(cross(T, B));
    return mat3(B, N, T);
}

// triplanar mapping
// c is world space noise (or etc)
// c.x=noise(P.zy), c.y=noise(P.xz), c.z=noise(P.xy)
float trip(vec3 c, vec3 N, float power = 1.0)
{
    N = pow(abs(N), vec3(power));
    return dot(c, N / dot(vec3(1), N));
}

// hacky version
vec2 uvtrip(vec3 P, vec3 N, float power = 1.0)
{
    N = sign(N) * pow(abs(N), vec3(power));
    N = N / dot(vec3(1), N);
    return N.x * P.zy + N.y * P.xz + N.z * P.xy;
}

vec2 orbit(float a)
{
    return vec2(cos(a), sin(a));
}

vec2 fold(vec2 p, float a)
{
    vec2 v = orbit(a);
    p -= 2.0 * min(0.0, dot(p, v)) * v;
    return p;
}

vec2 pmod(vec2 suv, float div, float shift = 0.0)
{
    float a = atan(suv.y, suv.x) + TAU - PI * 0.5 + PI / div;
    a = mod(a, TAU / div) + PI * 0.5 - PI / div - shift;
    return vec2(cos(a), sin(a)) * length(suv);
}