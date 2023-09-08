#version 430
out vec4 outColor;

#pragma include "common/input.glsl"

void main()
{
    vec4 back = texture(TimeTex, vec2(0.5));

    back.x += time_delta * timeSpeed;
    back.y += time_delta;

    outColor = back;
}