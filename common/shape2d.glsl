#pragma once

#pragma include "common/func.glsl"
#pragma include "common/noise.glsl"

// https://iquilezles.org/articles/distfunctions2d/
float sdSeg(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float sdBox(vec2 p, vec2 b)
{
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sBox(vec2 uv)
{
    vec2 auv = .5 - abs(uv - .5);
    return float(all(lessThan(vec2(0), auv)));
}

float sBoxFrame(vec2 uv, float npx)
{
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    vec2 wh = npx * px;
    vec2 auv = .5 - abs(uv - .5);
    return float(any(lessThan(auv, wh)) && all(lessThan(vec2(0), auv)));
}

float sCircle(vec2 uv, float r)
{
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float eps = max(px.x, px.y);
    return smoothstep(r, r - eps, length(uv - .5));
}
//0-1
float sGlyph(vec2 uv, float seed, float width)
{
    float div = 3.;
    const int line = 8;
    const int point = 1;
    float w = width;
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float eps = 3. * max(px.x, px.y);

    float c = 0.;
    for(int i; i < line; i++)
    {
        vec2 pt0 = hash23(vec3(i, seed, .24));
        vec2 pt1 = hash23(vec3(i + 1, seed, .24));
        pt0 = (floor(pt0 * div) + .5) / div;
        pt1 = (floor(pt1 * div) + .5) / div;
        float d = sdSeg(uv, pt0, pt1);
        c += smoothstep(w, w - eps, d) * float(hash12(vec2(seed, i)) < .5);
    }

    // point
    vec2 pt = hash23(vec3(1.2, seed, 23.17));
    pt = (floor(pt * div) + .5) / div;
    float d = length(uv - pt);
    c += smoothstep(w, w - eps, d);

    return c;
}

float sInternet(vec2 suv, float lt = 0.0)
{
    float c = 0.0;
    float l = length(suv);
    vec2 px = abs(dFdx(suv)) + abs(dFdy(suv));
    float eps = 2. * max(px.x, px.y);
    float w = 0.05;
    float ws = 0.15;

    float cl = float(length(suv) < 1.0 - w);

    float pz = sqrt(saturate(1.0 - pow(length(suv), 2.0)));
    vec3 p = vec3(suv, pz);
    p.xz *= rot(lt);

    float th = (atan(p.x, p.z) + PI) / TAU;
    float ph = p.y * .15;
    vec2 a = vec2(th, ph) * 15.0;
    c += dot(vec2(1), smoothstep(ws, ws - eps * 2.0, abs(fract(a) - .5)));

    float al = abs(l - 1.0 + w);
    c = c * cl + smoothstep(w, w - eps, al);

    return c;
}

float sdOresen(vec2 uv, float amp, float seed)
{
    const float span = .8;
    const float mina = .5;
    const float maxa = 2.;
    int xi = int(floor(uv.x / span));
    float xf = fract(uv.x / span);
    vec2 uvf = vec2(xf, uv.y);
    vec3 h = hash33(vec3(xi, 1.2, seed));
    vec3 hn = hash33(vec3(xi + 1, 1.2, seed));
    float y = h.x * amp;
    float yn = hn.x * amp;
    float m = 1. - abs(y - yn) / mix(mina, maxa, h.y);
    float ym = uvf.x < m ? y : mix(y, yn, (uvf.x - m) / (1. - m));
    return uvf.y - ym;
}

float sHUDBaki(vec2 uv, int n, float seed, float h = 1.0, float s = 1.0)
{
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float fn = float(n);
    float is = 1. / fn;
    float amp = is * s * h;
    vec2 sh = vec2(1, (1. - amp) * h) / float(n - 1);
    float c = 0.;
    for(int i; i < n; i++)
    {
        float fi = float(i);
		// constant step
		// vec2 sft=sh*float(i);
		// random step
        vec3 h3 = hash33(vec3(.3, 5.1, fi + seed));
        vec2 uvs = uv - sh * vec2(h3.x * fn, i);
        float sd = sdOresen(uvs, amp, fi + seed) * (i % 2 == 0 ? 1. : -1.);

        //斜線
        float shas = 1.0;
        // shas = float(h3.y < .9 || fract((uvs.x - uvs.y) / (px.x * 40.)) < .5);

        c += sign(sd) * shas;
        sd -= amp * .5;

        // 点線
        float ten = 1.0;
        // ten=float(h3.z < .9 || fract(uvs.x / (px.x * 40.)) < .3);

        c += (1. - c * 2.) * float(0. < sd && sd < px.y * 8.) * ten;
    }
    return saturate(c);
}

float sTunnel(vec2 suv, float lt = 0.0)
{
    float w = 0.1;
    vec2 px = abs(dFdx(suv)) + abs(dFdy(suv));
    float eps = 2. * max(px.x, px.y);
    vec3 rd = normalize(vec3(suv, .5)), ro = vec3(0, 0, lt), rp;
    float d, l = 0.;
    for(int i; i < 30; i++)
    {
        rp = rd * l + ro;
        float s = 2. * pow((l * .12), 4.);
        rp.xy += s * vec2(cos(lt * .1), sin(lt * .1));
        d = 2. - length(rp.xy);
        l += d * .5;
        if(l > 20. || d < 1e-3)
            break;
    }
    float c = 0.0;
    float a = 10. * (atan(rp.y, rp.x) + PI) / TAU;
    c += smoothstep(w, w - eps, abs(fract(a) - .5));
    c += smoothstep(w, w - eps, abs(fract(rp.z) - .5));
    return c;
}

float sdTorus(vec3 p, vec2 t)
{
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}
float sHole(vec2 suv, float lt = 0.0)
{
    float w = 0.1;
    vec2 px = abs(dFdx(suv)) + abs(dFdy(suv));
    float eps = 2. * max(px.x, px.y);

    float rad = 5.;
    float hole = 1.;
    vec3 rd = normalize(vec3(suv, 1)), ro = vec3(0, rad, -rad * .75), rp;
    rd.yz *= rot(PI * .25);
    float d, l = 0.;
    for(int i; i < 30; i++)
    {
        rp = rd * l + ro;
        float olen = length(rp.xz);
        float len = min(olen, rad);
        rp.xz = normalize(rp.xz) * len;
        rp.y = max(rp.y, 0.);
        d = sdTorus(rp, vec2(rad, rad - hole));
        l += d;
        if(l > 20. || d < 1e-3)
            break;
    }
    rp = rd * l + ro;
    float c = 0.;
    float a = 10. * (atan(rp.z, rp.x) + PI) / TAU;
    // c += float(fract(a) < .1);
    // c += float(fract(rp.y - lt) < .1);
    c += smoothstep(w, w - eps, abs(fract(a) - .5));
    c += smoothstep(w, w - eps, abs(fract(rp.y - lt) - .5));
    return c;
}

#define _sContourNoise(_uv) snoise(vec3(_uv,32.12+lt))
float sContour(vec2 uv, float npx, float f, float lt)
{
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float eps = npx * max(px.x, px.y);
    float l = eps;
    vec2 e = vec2(eps, 0);
    float n0 = _sContourNoise(uv + e.xy);
    float n1 = _sContourNoise(uv - e.xy);
    float n2 = _sContourNoise(uv + e.yx);
    float n3 = _sContourNoise(uv - e.yx);
    vec2 d = normalize(vec2(n0 - n1, n2 - n3));
	//float r0=fract(cyc(cseed(uv)).x*f);
    float n = (n0 + n1 + n2 + n3) * .25 * f;//Fast
    float r0 = fract(n);
    float r1 = fract(_sContourNoise(uv + d * l) * f);
    float c = 0.;
    c += float(abs(r0 - r1) > .5);

	// 好きな図形をかく
    // float ri = floor(n);
    // vec2 ruv = vec2((atan(d.y, d.x) + PI) / TAU, r0);
    // ruv.x = fract(ruv.x * 5. + lt * .5);
    // c += float(fract(ruv.x + ruv.y) < .5) * float(ri == 0.);
    return saturate(c);
}

float sWindow(inout vec2 uv)
{
    float npx = 1.0;
    float w = 10.0;
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float eps = npx * max(px.x, px.y);
    float epsy = npx * px.y;
    float c = 0.0;

    // 縮小
    uv = (uv - 0.5) * (1.0 + px * 4.0) + 0.5;

    c += sBoxFrame(uv, npx);
    c += float(1.0 - w * epsy < uv.y && uv.y < 1.0);

    vec2 puv = uvmap(uv, vec2(0, 1 - w * px.y), vec2(w * px.x, 1));
    c -= sCircle(puv, 0.4);
    c -= sCircle(puv - vec2(1, 0), 0.4);
    c -= sCircle(puv - vec2(2, 0), 0.4);

    c = saturate(c) * float(inuv(uv));
    uv = uvmap(uv, vec2(0), vec2(1, 1.0 - w * epsy));
    return c;
}

float sArrow(vec2 uv)
{
    float w = 0.1;
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float eps = max(px.x, px.y);

    float c = 0.0;
    vec2 auv = uv * 2.0 - 1.0;
    auv *= rot(PI * .25);
    auv = abs(auv);
    c += float(auv.x < w && auv.y < 1.0);

    vec2 nuv = uv * 2.0 - 1.0;
    float l = 1.0 / sqrt(2.0);
    c += float(l - w < nuv.x && nuv.x < l + w) * float(-l < nuv.y && nuv.y < l + w);
    c += float(l - w < nuv.y && nuv.y < l + w) * float(-l < nuv.x && nuv.x < l + w);

    return saturate(c);
}

float sPlus(vec2 uv, float w)
{
    const float l = 1.;
    vec2 auv = abs(uv);
    return float(all(lessThan(auv, vec2(l))) && any(lessThan(auv, vec2(w))));
}

float sSakana(vec2 uv, bool eat)
{
    uv = (uv - .5) * 2.0 + .5;
    uv.y -= .5;
    float c = .0;
    float x = uv.x - .38;
    float y = .2 - x * x * .5;
    float sq4 = sqrt(.4);
    c += float(uv.y < y == -uv.y < y) * float(-sq4 < x && x < sq4 + .3);
    vec2 euv = uv - vec2(.1, .05);
    if(eat)
    {
        c *= 1. - sPlus(euv * rot(PI * 0.25) * 10., .2);
        bool inh = -.1 < x && x < sq4 + .05;
        c *= float(x < -.1 || sq4 < x);
        float hx = (x + .1) / (sq4 + .1);
        c += float(inh) * float(fract(hx * 4. + .5) < .2 && abs(uv.y) < .15);
        c += float(inh) * float(abs(uv.y) < .025);
    }
    else
    {
        c *= 1. - float(length(euv) < .05);
    }

    return saturate(c);
}

float sEye(vec2 uv, float t)
{
    const float sc = 0.8;
    float lt = t * 5.0;
    float h1 = pcg11(floor(lt));
    float ease = fract(lt);
    float mabataki = pow(abs(ease - 0.5) * 2.0, 7.0);
    float w = 0.4 * (h1 < 0.05 ? mabataki : 1.0);
    uv = (uv - .5) / sc + .5;
    vec2 suv = uv * 2.0 - 1.0;
    suv.y = abs(suv.y);
    float x = suv.x, y = suv.y;
    float right = w * (1.0 - x * x);
    right *= pow(1.0 - saturate(abs(x)), 0.2);

    float c = 0.0;
    c += float(y < right);
    c -= sCircle(uv, w * 0.45);

    return saturate(c);
}

// UV --------------------------------------------------------------------------------------------

vec2 uvCut(vec2 uv, vec2 anc0, vec2 anc1, float len)
{
    vec2 cd = normalize(anc1 - anc0);
    vec2 ud = normalize(uv - anc0);
    float cs = dot(cd, ud);
    float cl = length(uv - anc0) * cs;
    vec2 cp = anc0 + cl * cd;
    float vl = length(cp - uv);
    vec2 vd = (cp - uv) / vl;
    vec2 ofs = vd * min(len, vl);
    return uv + ofs;
}

struct RecDivInfo
{
    vec2 uv;
    vec2 anc;
    vec2 wh;
    int b;
};
// aspect = resolution.xy / min(resolution.x, resolution.y)
RecDivInfo uvRecDiv(vec2 uv, int depth, vec2 aspect, float seed)
{
    vec2 anc = vec2(0);
    vec2 wh = vec2(1);
    int b = 0;
    for(int i = 0; i < depth; i++)
    {
        vec3 h3 = pcg33(vec3(b, i, seed));
        vec2 p = aspect * wh;
        float isf = p.x / (p.x + p.y);
        bool is = h3.x < isf;
        float d = h3.y;

        // fix
        d = mix(0.2, 0.8, d);
        // d = 0.5;

        float l = (is ? uv.x : uv.y);
        bool ilr = l < d;

        float s = (ilr ? d : 1. - d);
        float t = (ilr ? l : l - d);
        b = (b << 1) + int(ilr);
        if(is)
        {
            uv.x = t / s;
            anc.x += (ilr ? 0. : wh.x * d);
            wh.x *= s;
        }
        else
        {
            uv.y = t / s;
            anc.y += (ilr ? 0. : wh.y * d);
            wh.y *= s;
        }
    }

    RecDivInfo info;
    info.uv = uv;
    info.anc = anc;
    info.wh = wh;
    info.b = b;
    return info;
}

RecDivInfo uvRecDivInv(int ib, int depth, vec2 aspect, float seed)
{
    vec2 anc = vec2(0);
    vec2 wh = vec2(1);
    int b = 0;
    for(int i = 0; i < depth; i++)
    {
        vec3 h3 = pcg33(vec3(b, i, seed));
        vec2 p = aspect * wh;
        float isf = p.x / (p.x + p.y);
        bool is = h3.x < isf;
        float d = h3.y;

        // fix
        d = mix(0.2, 0.8, d);

        bool ilr = ((ib >> (depth - i - 1)) & 1) == 1;
        float s = (ilr ? d : 1. - d);
        b = (b << 1) + int(ilr);
        if(is)
        {
            anc.x += (ilr ? 0. : wh.x * d);
            wh.x *= s;
        }
        else
        {
            anc.y += (ilr ? 0. : wh.y * d);
            wh.y *= s;
        }
    }

    RecDivInfo info;
    info.anc = anc;
    info.wh = wh;
    return info;
}