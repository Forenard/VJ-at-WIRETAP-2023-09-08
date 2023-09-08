#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/font.glsl"

float param()
{
    float c = 0.0;
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    vec2 uv = fc / max(res.x, res.y);
    uv.x *= 2.0;
    vec2 fuv = fract(uv * 30.0);
    ivec2 iuv = ivec2(uv * 30.0);
    iuv.y = 29 - iuv.y;
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

    float param1 = sliders[2];
    c += char(0, 4, C_P);
    c += char(1, 4, C_R);
    c += char(2, 4, C_M);
    c += char(3, 4, C_1);
    c += char(4, 4, C_space);
    c += char(5, 4, C_colon);
    c += char(6, 4, getNumber(int(param1)));
    c += char(7, 4, getNumber(int(param1 * 10.0)));
    c += char(8, 4, getNumber(int(param1 * 100.0)));

    float param2 = sliders[3];
    c += char(0, 5, C_P);
    c += char(1, 5, C_R);
    c += char(2, 5, C_M);
    c += char(3, 5, C_2);
    c += char(4, 5, C_space);
    c += char(5, 5, C_colon);
    c += char(6, 5, getNumber(int(param2)));
    c += char(7, 5, getNumber(int(param2 * 10.0)));
    c += char(8, 5, getNumber(int(param2 * 100.0)));

    // float param3 = sliders[4];
    // c += char(0, 6, C_P);
    // c += char(1, 6, C_R);
    // c += char(2, 6, C_M);
    // c += char(3, 6, C_3);
    // c += char(4, 6, C_space);
    // c += char(5, 6, C_colon);
    // c += char(6, 6, getNumber(int(param3)));
    // c += char(7, 6, getNumber(int(param3 * 10.0)));
    // c += char(8, 6, getNumber(int(param3 * 100.0)));

    if(phaseBT.y < 3.0)
    {
    // phase
        fuv = fract(uv * 9.0);
        iuv = ivec2(uv * 9.0);
        iuv.y = 8 - iuv.y;
        fuv.x = (fuv.x - 0.5) * 0.5 + 0.5;
        c += char(1, 4, C_P);
        c += char(2, 4, C_H);
        c += char(3, 4, C_A);
        c += char(4, 4, C_S);
        c += char(5, 4, C_E);
        c += char(6, 4, C_colon);
        c += char(7, 4, getNumber(phaseCount / 100));
        c += char(8, 4, getNumber(phaseCount / 10));
        c += char(9, 4, getNumber(phaseCount));
    }

    return saturate(c);
}

void main()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res, suv = (2.0 * uv - 1.0) * asp;
    vec3 col = vec3(0);

    if(phaseCount < 2)
    {
        col = texture(Main3DMidTex, uv).rgb;
    }
    else if(phaseCount < 4)
    {
        col = texture(Max3DMidTex, uv).rgb;
    }
    else if(phaseCount == 4)
    {
        if(beatCount % 4 < 2)
        {
            col = texture(Main3DMidTex, uv).rgb;
        }
        else
        {
            col = texture(Max3DMidTex, uv).rgb;
        }
    }
    else if(phaseCount == 5)
    {
        col = texture(GirlTrainTex, uv).rgb * 0.8;
        // 文字出す
        float cs = 0.75;

        vec2 cuv = uvmap(suv, vec2(-cs), vec2(cs));
        cuv = (cuv - 0.5) * 1.5 + 0.5;
        float inc = floor(beatCount) + 1.0 - pow(saturate(1.0 / (1.0 + beatBT.y)), 100.0);
        cuv += vec2(inc, 0);
        vec2 fuv = fract(cuv * 2.0), iuv = floor(cuv * 2.0);
        cuv.x = fract(cuv.x);
        if(IsEye)
            cuv.y = fract(cuv.y);
        cuv = (cuv - 0.5) * 1.0 + 0.5;
        vec3 h3 = pcg33(vec3(iuv, 0.1));
        int ch = getRandomKanji(h3.yzx * 9.1);
        if(IsEye)
        {
            col += vec3(1, 0.1, 0.1) * printChar(cuv, C_eye, STYLE_INVERSE);
        }
        else
        {
            col += printChar(cuv, ch, int(h3.x * 5.0) % 5);
        }
    }
    else if(phaseCount == 6)
    {
        col = texture(Main3DMidTex, uv).rgb;
    }
    else if(phaseCount > 6)
    {
        col = texture(AcidMidTex, uv).rgb;
    }

    // Parameters
    col += param();

    outColor = vec4(col, 1);
}