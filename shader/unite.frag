#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"
#pragma include "common/brdf.glsl"
#pragma include "common/sdf.glsl"
#pragma include "common/noise.glsl"
#pragma include "common/shape2d.glsl"
/*
RIGHT_DISPLAY:1280x360 | MID_DISPLAY
FLOOR_DISPLAY:1280x360 | MID_DISPLAY:640x1080
LEFT_DISPLAY :1280x360 | MID_DISPLAY
*/
void main()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res, suv = (uv * 2.0 - 1.0) * asp;
    vec3 col = vec3(0.0);

    const vec2 unite = vec2(1920, 1080);
    const vec2 side = vec2(1280, 360);
    const vec2 mid = vec2(640, 1080);

    vec2 right_lb = vec2(0, side.y * 2.0);
    vec2 right_rt = vec2(side.x, unite.y);
    vec2 right_uv = remap(fc, right_lb, right_rt, vec2(0), vec2(1));

    vec2 floor_lb = vec2(0, side.y);
    vec2 floor_rt = vec2(side.x, side.y * 2.0);
    vec2 floor_uv = remap(fc, floor_lb, floor_rt, vec2(0), vec2(1));

    vec2 left_lb = vec2(0);
    vec2 left_rt = vec2(side.x, side.y);
    vec2 left_uv = remap(fc, left_lb, left_rt, vec2(0), vec2(1));

    vec2 mid_lb = vec2(side.x, 0);
    vec2 mid_rt = vec2(unite.x, unite.y);
    vec2 mid_uv = remap(fc, mid_lb, mid_rt, vec2(0), vec2(1));

    col += texture(FloorTex, floor_uv).rgb * float(inuv(floor_uv));
    col += texture(SideTex, right_uv).rgb * float(inuv(right_uv));
    col += texture(SideTex, left_uv).rgb * float(inuv(left_uv));
    col += texture(MidTex, mid_uv).rgb * float(inuv(mid_uv));

    col = saturate(col);
    // transition
    float lt = time * 0.05;
    vec3 cyc = cyclic(vec3(suv * 0.5 - lt, lt), 2.0);
    float ema = linearstep(-0.2, 0.0, cyc.z);
    ema *= pow(saturate(1.0 / (1.0 + max(0.0, phaseBT.y - 0.0))), 0.3) * smoothstep(3.0, 0.0, phaseBT.y);
    vec3 back = texture(UniteTex, uv).rgb;
    col = mix(col, back, ema);
    col = mix(col, back, EMA * 0.95);

    outColor = vec4(col, 1);
}