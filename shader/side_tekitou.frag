#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"
#pragma include "common/brdf.glsl"
#pragma include "common/sdf.glsl"
#pragma include "common/noise.glsl"
#pragma include "common/shape2d.glsl"
#pragma include "common/font.glsl"

vec3 tekitou0()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res, suv = (uv * 2.0 - 1.0) * asp;
    vec3 col = vec3(0);

    vec2 huv = suv;
    huv = abs(huv);
    huv *= rot(0.25 * PI * (pcg11(floor(beatCount) - 0.12) < 0.5 ? 1 : -1));
    huv.x -= time * 0.5;
    huv.y = fract(huv.y + 0.5);
    col += sHUDBaki(huv, 5, floor(beatCount));
    return col;
}

#define _sContourCustomNoise(_uv) snoise(vec3(_uv,32.12+lt))
float sContourCustom(vec2 uv, float npx, float f, float lt)
{
    vec2 px = abs(dFdx(uv)) + abs(dFdy(uv));
    float eps = npx * max(px.x, px.y);
    float l = eps;
    vec2 e = vec2(eps, 0);
    float n0 = _sContourCustomNoise(uv + e.xy);
    float n1 = _sContourCustomNoise(uv - e.xy);
    float n2 = _sContourCustomNoise(uv + e.yx);
    float n3 = _sContourCustomNoise(uv - e.yx);
    vec2 d = normalize(vec2(n0 - n1, n2 - n3));
	//float r0=fract(cyc(cseed(uv)).x*f);
    float n = (n0 + n1 + n2 + n3) * .25 * f;//Fast
    float r0 = fract(n);
    float r1 = fract(_sContourCustomNoise(uv + d * l) * f);
    float c = 0.;
    c += float(abs(r0 - r1) > .5);

	// 好きな図形をかく
    float ri = floor(n);
    vec2 ruv = vec2((atan(d.y, d.x) + PI) / TAU, r0);
    ruv.x = ruv.x * 10. + lt * 10.0;
    ruv = fract(ruv);
    float ok = float(ri == 0.);
    c += printChar(ruv, C_eye, STYLE_INVERSE) * ok;
    return saturate(c);
}

vec3 tekitou1()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res, suv = (uv * 2.0 - 1.0) * asp;
    vec3 col = vec3(0);

    float lt = time * 0.05;
    col += vec3(1, 0.1, 0.1) * sContourCustom(suv * 0.8, 2.0, 1.5, lt);

    return col;
}

void main()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res, suv = (uv * 2.0 - 1.0) * asp;
    vec3 col = vec3(0);

    if(IsEye)
    {
        col += tekitou1();
    }
    else
    {
        col += tekitou0();
    }

    outColor = vec4(col, 1);
}