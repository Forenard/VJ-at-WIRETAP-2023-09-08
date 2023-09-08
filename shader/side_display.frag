#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/font.glsl"

float param()
{
    float c = 0.0;
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    vec2 uv = fc / min(res.x, res.y);
    uv.x *= 2.0;
    vec2 fuv = fract(uv * 15.0);
    ivec2 iuv = ivec2(uv * 15.0);
    iuv.y = 14 - iuv.y;
    fuv.x = (fuv.x - 0.5) * 0.5 + 0.5;

    #define char(_a,_b,_c) (iuv == ivec2(_a, _b) ? printChar(fuv, _c, STYLE_INVERSE) : 0.0)

    c += char(0, 0, C_E);
    c += char(1, 0, C_Y);
    c += char(2, 0, C_E);
    c += char(3, 0, C_space);
    c += char(4, 0, C_space);
    c += char(5, 0, C_colon);
    c += char(6, 0, C_eye) * float(IsEye);

    c += char(0, 1, C_B);
    c += char(1, 1, C_E);
    c += char(2, 1, C_A);
    c += char(3, 1, C_T);
    c += char(4, 1, C_space);
    c += char(5, 1, C_colon);
    c += char(6, 1, getRandomKanji(vec3(beatCount, 0.1, -1.1))) * float(beatCount % 4 == 0);
    c += char(7, 1, getRandomKanji(vec3(beatCount, 0.2, -1.2))) * float(beatCount % 4 == 1);
    c += char(8, 1, getRandomKanji(vec3(beatCount, 0.3, -1.3))) * float(beatCount % 4 == 2);
    c += char(9, 1, getRandomKanji(vec3(beatCount, 0.4, -1.4))) * float(beatCount % 4 == 3);

    c += char(0, 2, C_P);
    c += char(1, 2, C_H);
    c += char(2, 2, C_A);
    c += char(3, 2, C_S);
    c += char(4, 2, C_E);
    c += char(5, 2, C_colon);
    c += char(6, 2, getNumber(phaseCount / 100));
    c += char(7, 2, getNumber(phaseCount / 10));
    c += char(8, 2, getNumber(phaseCount));

    float pg = phaseGain;
    c += char(0, 3, C_G);
    c += char(1, 3, C_A);
    c += char(2, 3, C_I);
    c += char(3, 3, C_N);
    c += char(4, 3, C_space);
    c += char(5, 3, C_colon);
    c += char(6, 3, getNumber(int(pg)));
    c += char(7, 3, getNumber(int(pg * 10.0)));
    c += char(8, 3, getNumber(int(pg * 100.0)));

    if(phaseBT.y < 3.0)
    {
    // phase
        fuv = fract(uv * 5.0);
        iuv = ivec2(uv * 5.0);
        iuv.y = 4 - iuv.y;
        fuv.x = (fuv.x - 0.5) * 0.5 + 0.5;
        c += char(1, 2, C_P);
        c += char(2, 2, C_H);
        c += char(3, 2, C_A);
        c += char(4, 2, C_S);
        c += char(5, 2, C_E);
        c += char(6, 2, C_colon);
        c += char(7, 2, getNumber(phaseCount / 100));
        c += char(8, 2, getNumber(phaseCount / 10));
        c += char(9, 2, getNumber(phaseCount));
    }

    return saturate(c);
}

void main()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    vec2 uv = fc / res;
    vec3 col = vec3(0);

    if(phaseCount < 2)
    {
        col = texture(Main3DSideTex, uv).rgb;
    }
    else if(phaseCount < 4)
    {
        col = texture(Max3DSideTex, uv).rgb;
    }
    else if(phaseCount == 4)
    {
        if(beatCount % 4 < 2)
        {
            col = texture(Max3DSideTex, uv).rgb;
        }
        else
        {
            col = texture(Main3DSideTex, uv).rgb;
        }
    }
    else if(phaseCount == 5)
    {
        col = texture(SnowTex, uv).rgb * 0.5;
    }
    else if(phaseCount == 6)
    {
        col = texture(Main3DSideTex, uv).rgb;
    }
    else if(phaseCount > 6)
    {
        col = texture(AcidSideTex, uv).rgb;
    }

    // Parameters
    col += param();

    outColor = vec4(col, 1);
}