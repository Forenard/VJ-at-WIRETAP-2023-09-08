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

#define Tika float(fract(Time/2.0)<0.5 && (phaseCount == 0))

float printGlitch(vec2 uv, int id, int style = STYLE_NORMAL, vec3 invs = vec3(1))
{
    vec3 h3 = pcg33(vec3(floor(Time * 10.0), -.9 + id, .1));
    id = h3.x < 0.01 ? getRandomChar(h3) : id;
    return printChar(uv, id, hash13(invs) < 0.3 ? STYLE_INVERSE : style);
}

float kxr(vec2 uv)
{
    uv = 1.5 * (uv - 0.5) + 0.5;
    float c = 0.0;

    float grid = 7.0;
    vec2 chrAsp = vec2(1, 5.0 / 7.0);
    vec2 grid2 = grid * chrAsp;

    vec2 fuv = fract(uv * grid2), iuv = floor(uv * grid2);
    ivec2 gridID = ivec2(iuv + 0.5);

    // fix uv size
    fuv = 0.4 * (fuv - 0.5) / chrAsp + 0.5;

    const int KESHIRAE[7] = int[7](C_K, C_E, C_S, C_I, C_R, C_A, C_E);
    int keshiraeID = gridID.x;
    bool inKeshirae = (0 <= gridID.x && gridID.x < 7) && (gridID.y == 3);
    c += inKeshirae ? printGlitch(fuv, KESHIRAE[keshiraeID], STYLE_BOLD) : 0.0;

    int xID = 3;
    bool inX = (gridID.x == xID) && (gridID.y == 2);
    c += inX ? printGlitch(fuv, C_X, STYLE_BOLD) : 0.0;

    const int RE_NARD[7] = int[7](C_R, C_E, C_space, C_N, C_A, C_R, C_D);
    int renardID = gridID.x;
    bool inRenard = (0 <= gridID.x && gridID.x < 7) && (gridID.y == 1);
    c += inRenard ? printGlitch(fuv, RE_NARD[renardID], STYLE_BOLD) : 0.0;

    c += sBoxFrame(fuv, 1.0) * Tika;
    c = saturate(c) * float(inuv(uv));

    vec2 huv = uv;
    huv = (huv - 0.5) / 1.5;
    huv = fold(huv, PI * 1.75);
    huv = fold(huv, PI * 1.25) + 0.5;
    huv *= vec2(4, 8);
    c += (1.0 - 2.0 * c) * sHUDBaki(huv, IsEye ? 3 : 2, floor(beatCount));

    return c;
}

RecDivInfo uvRecDivInvCustom(int ib, int depth, vec2 aspect, float seed)
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
        // d = mix(0.2, 0.8, d);
        d = 0.5;

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
float annnai(vec2 uv)
{
    float c = 0.0;

    int depth = 2 + int(phaseGain * 2.0);
    float lt = Time;
    float s0 = beatBT.w, s1 = s0 + 1.0;
    float ease = 1.0 - pow(1.0 / (1.0 + beatBT.y), 20.0);
    vec2 ruv = vec2(0);
    int b = 0;
    bool isin = false;
    int N = (1 << depth);
    for(int i = 0; i < N; i++)
    {
        int _b = i;
        RecDivInfo info0 = uvRecDivInvCustom(_b, depth, vec2(1), s0);
        RecDivInfo info1 = uvRecDivInvCustom(_b, depth, vec2(1), s1);

        vec2 wh = mix(info0.wh, info1.wh, ease);
        vec2 anc = mix(info0.anc, info1.anc, ease);
        vec2 _uv = uvmap(uv, anc, anc + wh);
        bool _in = inuv(_uv);
        isin = isin || _in;
        ruv = (_in ? _uv : ruv);
        b = (_in ? _b : b);
    }

    vec2 rpx = abs(dFdx(ruv)) + abs(dFdy(ruv));
    vec2 raspmi = min(rpx.x, rpx.y) / rpx;
    vec2 raspma = max(rpx.x, rpx.y) / rpx;
    vec2 sruvmi = (ruv * 2.0 - 1.0) * raspmi;
    vec2 sruvma = (ruv * 2.0 - 1.0) * raspma;

    vec3 h3 = pcg33(vec3(b, -9.8, EyeCount));
    float rc = 0.0;

    // glitch
    vec3 gl = pcg33(vec3(h3.zy, floor(ruv.y * 10.0)));
    ruv.x += gl.z < mix(0.05, 0.5, phaseGain) && (hash11(floor(Time * 10.0)) < 0.1 || (pcg33(vec3(gl.xy, floor(Time * 2.0))).x < 0.1)) ? gl.x - 0.5 : 0.0;

    vec3 ch = pcg33(vec3(floor(ruv * raspma), h3.z + 0.12));
    if(IsEye)
    {
        vec2 cuv = fract(ruv * raspma);
        if(h3.z < 0.7)
        {
            rc += printGlitch(cuv, C_eye, STYLE_BOLD, ch);
        }
        else
        {
            vec2 iuv = floor(ruv * raspma);
            vec3 he = pcg33(vec3(iuv, h3.y));
            cuv = (cuv - 0.5) * rot(he.y * TAU) + 0.5;
            rc += sEye(cuv, Time + he.x * 100.0);
        }
    }
    else if(h3.x < 0.2)
    {
        vec2 cuv = fract(ruv * raspma);
        float a = floor(h3.y * 4.0) / 4.0 * TAU;
        cuv = (cuv - 0.5) * rot(a) + 0.5;
        rc += sArrow(cuv);
    }
    else if(h3.x < 0.4)
    {
        const int ckai = 2696, csatsu = 2886;
        vec2 cuv = fract(ruv * raspma), iuv = floor(ruv * raspma);
        int id = int(iuv.x - (iuv.y - 1) * raspma.x + 0.5) % 2;
        rc += printGlitch(cuv, (id == 0 ? ckai : csatsu), STYLE_BOLD, ch);
    }
    else if(h3.x < 0.6)
    {
        const int cde = 1035, cguchi = 1235;
        vec2 cuv = fract(ruv * raspma), iuv = floor(ruv * raspma);
        int id = int(iuv.x - (iuv.y - 1) * raspma.x + 0.5) % 2;
        rc += printGlitch(cuv, (id == 0 ? cde : cguchi), STYLE_BOLD, ch);
    }
    else if(h3.x < 0.8)
    {
        int alp = C_A + int(h3.y * 3.0);
        int num = C_1 + int(h3.z * 6.0);
        vec2 cuv = fract(ruv * raspma), iuv = floor(ruv * raspma);
        int id = int(iuv.x - (iuv.y - 1) * raspma.x + 0.5) % 2;
        cuv = 0.75 * (cuv - 0.5) + 0.5;
        rc += printGlitch(cuv, (id == 0 ? alp : num), STYLE_BOLD, ch);
    }
    else
    {
        vec2 cuv = fract(ruv * raspma);
        float a = floor(h3.y * 4.0) / 4.0 * TAU;
        rc += sCircle(cuv, 0.4);
        cuv = (cuv - 0.5) + 0.5;
        rc -= printGlitch(cuv, C_i, STYLE_BOLD);
    }

    rc *= float(inuv(ruv));
    c += rc;

    return saturate(c) * float(inuv(uv));
}

float wiretap(vec2 uv)
{
    float c = 0.0;

    c = rgb2gray(texture(WiretapTex, uv).rgb);

    return c;
}

vec3 render(float t)
{
    Time = t;

    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res;
    vec2 suv = (uv * 2.0 - 1.0) * asp;

    float c = 0.0;
    if(endBT.w > 0.5)
    {
        c += wiretap(uv);
    }
    else if(phaseCount == 0)
    {
        c += kxr(uv);
    }
    else
    {
        c += annnai(uv);
    }

    vec3 col = IsEye ? vec3(1, 0.1, 0.1) : hex2rgb(0xF5DB0C);
    col *= 1.0 - c;

    float de = sCircle(uv, 0.02) + sBoxFrame(abs(suv), 3.0);
    de *= Tika;
    col.gb -= de;
    col.r += de;
    return col;
}

void main()
{
    vec3 col = render(time);

    outColor = vec4(col, 1);
}