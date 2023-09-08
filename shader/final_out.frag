#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"

void main()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    vec2 uv = fc / res;
    vec3 col = texture(UniteTex, uv).rgb;

    // VHS
    int vhsN = 64;
    vec3 vhsc = vec3(0);
    vec2 shf = vec2(20.0 / res.x, 0);
    for(int i = 0; i < vhsN; i++)
    {
        float ins = float(i) / float(vhsN);
        vhsc += cloma0(ins) * texture(UniteTex, uv - shf * mix(-1.0, 1.0, ins)).rgb;
    }
    vhsc /= float(vhsN);
    col = mix(col, vhsc, VHS);

    // laplacian edge
    if(tikaTikaCount % 2 == 1)
    {
        const float kernel[9] = float[9](-1., -1., -1., -1., 8., -1., -1., -1., -1.);
        vec2 p = 1.0 / res;
        vec3 edge = vec3(0);
        for(int i = 0; i < 9; i++)
        {
            vec2 d = vec2(i % 3, i / 3) - 1.0;
            edge += kernel[i] * texture(UniteTex, uv + d * p).rgb;
        }
        col = saturate(edge);
    }

    // color 調整
    // 嘘 Gamma Correction
    col = pow(col, vec3(0.9));
    col = acesFilm(col);

    // I'm 0b5vr fanboy
    #define COG(_s,_b) col._s = smoothstep(0.0-(_b)*0.5,1.0+(_b)*0.5,col._s)
    COG(r, 0.05);
    COG(g, -0.1);
    COG(b, 0.3);

    col = saturate(col);

    outColor = vec4(col, 1);
}