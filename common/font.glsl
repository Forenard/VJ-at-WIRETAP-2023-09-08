#pragma once

#pragma include "common/func.glsl"
#pragma include "common/noise.glsl"

uniform sampler2D FontTex;

// Chars Area ------------------------------------------------------------------------------

#define C_0 16
#define C_1 17
#define C_2 18
#define C_3 19
#define C_4 20
#define C_5 21
#define C_6 22
#define C_7 23
#define C_8 24
#define C_9 25

#define C_a 65
#define C_b 66
#define C_c 67
#define C_d 68
#define C_e 69
#define C_f 70
#define C_g 71
#define C_h 72
#define C_i 73
#define C_j 74
#define C_k 75
#define C_l 76
#define C_m 77
#define C_n 78
#define C_o 79
#define C_p 80
#define C_q 81
#define C_r 82
#define C_s 83
#define C_t 84
#define C_u 85
#define C_v 86
#define C_w 87
#define C_x 88
#define C_y 89
#define C_z 90

#define C_A 33
#define C_B 34
#define C_C 35
#define C_D 36
#define C_E 37
#define C_F 38
#define C_G 39
#define C_H 40
#define C_I 41
#define C_J 42
#define C_K 43
#define C_L 44
#define C_M 45
#define C_N 46
#define C_O 47
#define C_P 48
#define C_Q 49
#define C_R 50
#define C_S 51
#define C_T 52
#define C_U 53
#define C_V 54
#define C_W 55
#define C_X 56
#define C_Y 57
#define C_Z 58

#define C_space 0
#define C_left 8
#define C_right 9
#define C_ast 10
#define C_plus 11
#define C_minus 13
#define C_slash 15
#define C_equal 29
#define C_comma 14
#define C_colon 26
#define C_que 31

#define C_eye 4113

// Chars Area ------------------------------------------------------------------------------

#define FontTex_RES ivec2(68, 68)
#define Font_Size ivec2(84, 84)
#define Font_Baseline ivec2(-18, 24)

#define STYLE_NORMAL 0
#define STYLE_BOLD 1
#define STYLE_OUTLINE 2
#define STYLE_THIN 3
#define STYLE_INVERSE 4

bool IsHalf(int id)
{
    return (0 <= id && id <= 94) || (7073 <= id && id <= 7130);
}

int getNumber(int num)
{
    switch(num % 10)
    {
        case 0:
            return C_0;
        case 1:
            return C_1;
        case 2:
            return C_2;
        case 3:
            return C_3;
        case 4:
            return C_4;
        case 5:
            return C_5;
        case 6:
            return C_6;
        case 7:
            return C_7;
        case 8:
            return C_8;
        case 9:
            return C_9;
        default:
            return C_0;
    }
}
int getRandomChar(vec3 seed)
{
    // const int kanji_min = 650, kanji_max = 4399;
    const int kanji_min = 0, kanji_max = 4600;
    return int(float(kanji_max - kanji_min) * pcg33(seed).x) + kanji_min;
}
int getRandomKanji(vec3 seed)
{
    const int kanji_min = 650, kanji_max = 4399;
    // const int kanji_min = 0, kanji_max = 4600;
    return int(float(kanji_max - kanji_min) * pcg33(seed).x) + kanji_min;
}

float _median(float r, float g, float b)
{
    return max(min(r, g), min(max(r, g), b));
}
float printChar(vec2 uv, int id, int style = STYLE_NORMAL)
{
    if(id < 0)
        return 0.0;

    vec2 cuv = uv / vec2(FontTex_RES) + vec2(id % FontTex_RES.x, id / FontTex_RES.x) / vec2(FontTex_RES);
    // 中心へのオフセット
    if(IsHalf(id))
    {
        cuv -= vec2(9.5, 3) / vec2(Font_Size) / vec2(FontTex_RES);
    }
    else
    {
        cuv -= vec2(-6, 2.5) / vec2(Font_Size) / vec2(FontTex_RES);
    }
    vec4 tex = texture(FontTex, cuv);
    float dist = _median(tex.r, tex.g, tex.b);
    if(style == STYLE_BOLD || style == STYLE_OUTLINE || style == STYLE_INVERSE)
    {
        dist -= 0.3;
    }
    else if(style == STYLE_THIN)
    {
        dist -= 0.6;
    }
    else
    {
        dist -= 0.5;
    }
    float sig = fwidth(dist);
    float c = smoothstep(-sig, sig, dist) * tex.a * float(id != 0);
    if(style == STYLE_OUTLINE)
    {
        dist -= 0.3;// 太さ
        sig = fwidth(dist);
        c -= smoothstep(-sig, sig, dist) * tex.a * float(id != 0);
    }
    if(style == STYLE_INVERSE)
    {
        c = (1.0 - saturate(c)) * float(inuv(uv));
    }
    else
    {
        c = saturate(c) * float(inuv(uv));
    }
    return c;
}
