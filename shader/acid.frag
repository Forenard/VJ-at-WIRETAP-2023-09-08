#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"
#pragma include "common/brdf.glsl"
#pragma include "common/sdf.glsl"
#pragma include "common/noise.glsl"
#pragma include "common/shape2d.glsl"
#pragma include "common/font.glsl"

float Time;

vec3 render(float t)
{
    Time = t;
    vec3 col = vec3(0);
    float c = 0.0;
    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res;
    vec2 suv = (uv * 2.0 - 1.0) * asp;

    float lt = Time;
    int depth = 5;
    float s0 = beatBT.w, s1 = s0 + 1.0;
    float ease = 1.0 - pow(1.0 / (1.0 + beatBT.y), 10.0);

    // RecDivInfo info0 = uvRecDiv(uv, depth, asp, s0);
    // c += sWindow(info0.uv, 1.0);
    vec2 ruv = vec2(0);
    int b = 0;
    bool isin = false;
    for(int i = 0; i < (1 << depth); i++)
    {
        int _b = i;
        RecDivInfo info0 = uvRecDivInv(_b, depth, asp, s0);
        RecDivInfo info1 = uvRecDivInv(_b, depth, asp, s1);

        vec2 wh = mix(info0.wh, info1.wh, ease);
        vec2 anc = mix(info0.anc, info1.anc, ease);
        vec2 _uv = uvmap(uv, anc, anc + wh);
        bool _in = inuv(_uv);
        isin = isin || _in;
        ruv = (_in ? _uv : ruv);
        b = (_in ? _b : b);
    }
    c += sWindow(ruv);
    vec2 rpx = abs(dFdx(ruv)) + abs(dFdy(ruv));
    vec2 raspmi = min(rpx.x, rpx.y) / rpx;
    vec2 raspma = max(rpx.x, rpx.y) / rpx;
    vec2 sruvmi = (ruv * 2.0 - 1.0) * raspmi;
    vec2 sruvma = (ruv * 2.0 - 1.0) * raspma;

    vec3 h3 = pcg33(vec3(b, -9.8, 1.5));
    float rc = 0.0;
    if(IsEye)
    {
        rc += printChar(fract((sruvma + 1.0) * 0.5), C_eye, STYLE_INVERSE);
    }
    else if(h3.x < 0.1)
    {
        float sp = mix(-1.0, 1.0, h3.y);
        sp += sign(sp);
        rc += sTunnel(sruvmi, Time * sp);
    }
    else if(h3.x < 0.2)
    {
        float sp = mix(-1.0, 1.0, h3.y);
        sp += sign(sp);
        vec2 ituv = fract((sruvma + 1.0) * 0.5) * 2.0 - 1.0;
        ituv *= 1.25;
        rc += sInternet(ituv, Time * sp);
    }
    else if(h3.x < 0.3)
    {
        vec2 guv = (sruvmi + 1.0) * 3.0;
        float glt = Time * 1.0 + h3.y;
        guv.y += floor(glt) + pow(fract(glt), 10.0);
        vec2 guvf = fract(guv), guvi = floor(guv);
        vec3 gs = pcg33(vec3(guvi, h3.y * 42.9));
        rc += gs.z < .75 ? sGlyph(guvf, gs.x, 0.07) : printChar(guvf, getRandomKanji(gs), STYLE_BOLD);
    }
    else if(h3.x < 0.4)
    {
        vec2 cuv = sruvmi;
        float clt = Time * 0.1 + h3.y * 50.0;
        rc += sContour(cuv, 1.0, 3.0, clt);
    }
    else
    {
        if(phaseCount == 7)
        {
            if(IsMid())
            {
                col += float(inuv(ruv)) * (texture(Max3DMidTex, uv).rgb);
            }
            else
            {
                col += float(inuv(ruv)) * (texture(Max3DSideTex, uv).rgb);
            }
        }
        else
        {
            if(IsMid())
            {
                col += float(inuv(ruv)) * (texture(Main3DMidTex, uv).rgb);
            }
            else
            {
                col += float(inuv(ruv)) * (texture(Main3DSideTex, uv).rgb);
            }
        }
    }

    rc *= float(inuv(ruv));
    c *= float(isin);
    col += vec3(c) + vec3(0.1, 1.0, 0.1) * rc;
    return col;
}

void main()
{
    vec3 col = render(time);

    outColor = vec4(col, 1);
}