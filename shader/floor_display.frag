#version 430
out vec4 outColor;

#pragma include "common/input.glsl"

void main()
{
    vec2 fc = gl_FragCoord.xy, res = resolution.xy;
    vec2 uv = fc / res;
    vec3 col = vec3(0);
    if(phaseCount < 5)
    {
        col = texture(SideTekitouTex, uv).rgb;
    }
    else if(phaseCount == 5)
    {
        col = texture(SnowTex, uv).rgb;
    }
    else if(phaseCount == 6)
    {
        col = texture(SideTekitouTex, uv).rgb;
    }
    else if(phaseCount > 6)
    {
        col = texture(Max3DSideTex, uv).rgb;
    }
    outColor = vec4(col, 1);
}