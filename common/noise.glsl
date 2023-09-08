#pragma once

#pragma include "common/func.glsl"

// Hash without Sine by David Hoskins.
// https://www.shadertoy.com/view/4djSRW
//----------------------------------------------------------------------------------------
//  1 out, 1 in...
float hash11(float p)
{
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

//----------------------------------------------------------------------------------------
//  1 out, 2 in...
float hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

//----------------------------------------------------------------------------------------
//  1 out, 3 in...
float hash13(vec3 p3)
{
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}
//----------------------------------------------------------------------------------------
// 1 out 4 in...
float hash14(vec4 p4)
{
    p4 = fract(p4 * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.x + p4.y) * (p4.z + p4.w));
}

//----------------------------------------------------------------------------------------
//  2 out, 1 in...
vec2 hash21(float p)
{
    vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);

}

//----------------------------------------------------------------------------------------
///  2 out, 2 in...
vec2 hash22(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);

}

//----------------------------------------------------------------------------------------
///  2 out, 3 in...
vec2 hash23(vec3 p3)
{
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

//----------------------------------------------------------------------------------------
//  3 out, 1 in...
vec3 hash31(float p)
{
    vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

//----------------------------------------------------------------------------------------
///  3 out, 2 in...
vec3 hash32(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

//----------------------------------------------------------------------------------------
///  3 out, 3 in...
vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);

}

//----------------------------------------------------------------------------------------
// 4 out, 1 in...
vec4 hash41(float p)
{
    vec4 p4 = fract(vec4(p) * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);

}

//----------------------------------------------------------------------------------------
// 4 out, 2 in...
vec4 hash42(vec2 p)
{
    vec4 p4 = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);

}

//----------------------------------------------------------------------------------------
// 4 out, 3 in...
vec4 hash43(vec3 p)
{
    vec4 p4 = fract(vec4(p.xyzx) * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

//----------------------------------------------------------------------------------------
// 4 out, 4 in...
vec4 hash44(vec4 p4)
{
    p4 = fract(p4 * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

// https://www.pcg-random.org/
uint pcg1d(uint v)
{
    uint state = v * 747796405u + 2891336453u;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}
float pcg11(float v)
{
    uint u = pcg1d(floatBitsToUint(v));
    return float(u) / float(0xffffffffu);
}

uvec2 pcg2d(uvec2 v)
{
    v = v * 1664525u + 1013904223u;

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v >> 16u);

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v >> 16u);

    return v;
}
vec2 pcg22(vec2 v)
{
    uvec2 u = pcg2d(floatBitsToUint(v));
    return vec2(u) / float(0xffffffffu);
}

// http://www.jcgt.org/published/0009/03/02/
uvec3 pcg3d(uvec3 v)
{

    v = v * 1664525u + 1013904223u;

    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;

    v ^= v >> 16u;

    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;

    return v;
}
vec3 pcg33(vec3 v)
{
    uvec3 u = pcg3d(floatBitsToUint(v));
    return vec3(u) / float(0xffffffffu);
}

// http://www.jcgt.org/published/0009/03/02/
uvec4 pcg4d(uvec4 v)
{
    v = v * 1664525u + 1013904223u;

    v.x += v.y * v.w;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v.w += v.y * v.z;

    v ^= v >> 16u;

    v.x += v.y * v.w;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v.w += v.y * v.z;

    return v;
}
vec4 pcg44(vec4 v)
{
    uvec4 u = pcg4d(floatBitsToUint(v));
    return vec4(u) / float(0xffffffffu);
}

// Voronoi - distances by iq
// https://www.shadertoy.com/view/ldl3W8
vec3 voronoi(vec2 x)
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    //----------------------------------
    // first pass: regular voronoi
    //----------------------------------
    vec2 mg, mr;

    float md = 8.0;
    for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++)
        {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash22(n + g);
            vec2 r = g + o - f;
            float d = dot(r, r);

            if(d < md)
            {
                md = d;
                mr = r;
                mg = g;
            }
        }

    //----------------------------------
    // second pass: distance to borders
    //----------------------------------
    md = 8.0;
    for(int j = -2; j <= 2; j++) for(int i = -2; i <= 2; i++)
        {
            vec2 g = mg + vec2(float(i), float(j));
            vec2 o = hash22(n + g);
            vec2 r = g + o - f;

            if(dot(mr - r, mr - r) > 0.00001)
                md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
        }

    return vec3(md, mr);
}

// https://www.shadertoy.com/view/XsX3zB
// by nikat
float snoise(vec3 p)
{
    const float F3 = 0.3333333;
    const float G3 = 0.1666667;
    vec3 s = floor(p + dot(p, vec3(F3)));
    vec3 x = p - s + dot(s, vec3(G3));

    vec3 e = step(vec3(0.0), x - x.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);

    vec3 x1 = x - i1 + G3;
    vec3 x2 = x - i2 + 2.0 * G3;
    vec3 x3 = x - 1.0 + 3.0 * G3;

    vec4 w, d;

    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);

    w = max(0.6 - w, 0.0);

    d.x = dot(hash33(s), x);
    d.y = dot(hash33(s + i1), x1);
    d.z = dot(hash33(s + i2), x2);
    d.w = dot(hash33(s + 1.0), x3);

    w *= w;
    w *= w;
    d *= w;

    return dot(d, vec4(52.0));
}

// Vorocracks marble by FabriceNeyret2
// https://www.shadertoy.com/view/Xs3fR4
// -1~1
float perlin12(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3. - 2. * f); // smoothstep

    float v = mix(mix(hash12(i + vec2(0, 0)), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
    return 2. * v - 1.;
}

// -1~1
vec2 fbm22(vec2 p)
{
    vec2 v = vec2(0);
    float a = .5;
    mat2 R = rot(.37);

    for(int i = 0; i < 6; i++, p *= 2., a /= 2.) p *= R, v += a * vec2(perlin12(p), perlin12(p + 17.7));

    return v;
}
// -1~1
float fbm12(vec2 p)
{
    float v = 0., a = .5;
    mat2 R = rot(.37);

    for(int i = 0; i < 9; i++, p *= 2., a /= 2.) p *= R, v += a * perlin12(p);

    return v;
}

// Wet Concrete by kaneta
// https://www.shadertoy.com/view/tsjXDV
float concrete(vec2 p)
{
    const int octaves = 3;
    p *= 0.1;
    float n = perlin12(p * 1000.0);// so rough noise
    float f = remapc(fbm12(p * 12.0), -0.2, 0.4, 0.0, 1.0);// fbm for detail

    float d = 999999.9;

    float height = 1.0;
    float alpha = 2.0;

    mat2 R = rot(.37) * 1.5;

    // fractal voronoi
    for(int i = 0; i < octaves; i++)
    {
        vec3 c = voronoi(8.0 * p + fbm22(p * 8.0));
        height -= smoothstep(0.05, 0.0, c.x) * alpha * remapc(fbm12(p * 12.0), 0.0, 0.4, 0.0, 1.0);
        alpha *= 0.55;
        d = min(d, c.x);
        p *= R;
    }

    // heightだけなら saturate(height) でいいと思う
    float v = height - f;
    // normalize maybe -2. ~ -1. ?
    v = remapc(v, -2., 1.0, 0.0, 1.0);
    return v;

    // original
    // float v = height + n * 0.1 - f;
    // v = (v - .5) * 0.05 + .5; // contrast
}
// triplanar mapping heavy...
float concrete3d(vec3 P, vec3 N, float power = 1.0)
{
    float cz = concrete(P.xy);
    float cx = concrete(P.zy);
    float cy = concrete(P.xz);
    vec3 c = vec3(cx, cy, cz);
    return trip(c, N, power);
}

// Cyclic Noise by nimitz (explained by jeyko)
// https://www.shadertoy.com/view/3tcyD7
// And edited by 0b5vr
// https://scrapbox.io/0b5vr/Cyclic_Noise
vec3 cyclic(vec3 p, float freq = 2.0, vec3 seed = vec3(1, 2, 3))
{
    const int octaves = 8;
    vec4 n = vec4(0);
    mat3 bnt = getBNT(seed);

    for(int i = 0; i < octaves; i++)
    {
        p += sin(p.yzx);
        n += vec4(cross(cos(p), sin(p.zxy)), 1);
        p *= bnt * freq;
    }

    return n.xyz / n.w;
}

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float fbm13(vec3 x)
{
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for(int i = 0; i < 5; ++i)
    {
        v += a * snoise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// https://iquilezles.org/articles/warp/
float domainWarping(vec3 p, out vec3 q, out vec3 r)
{
    vec3 s0 = vec3(0.2, 4.2, 3.1) * 0.5;
    vec3 s1 = vec3(1.7, 9.2, 2.3) * 0.5;
    vec3 s2 = vec3(8.3, 2.8, 9.8) * 0.5;
    q = vec3(fbm13(p + s0), fbm13(p + s1), fbm13(p + s2));

    vec3 s3 = vec3(4.7, 1.5, 0.9) * 0.5;
    vec3 s4 = vec3(4.1, 2.9, 5.6) * 0.5;
    vec3 s5 = vec3(6.3, 7.9, 2.5) * 0.5;
    vec3 l = p + 4.0 * q;
    r = vec3(fbm13(l + s3), fbm13(l + s4), fbm13(l + s5));

    return fbm13(p + 4.0 * r);
}
