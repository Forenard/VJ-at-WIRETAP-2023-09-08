#version 430
out vec4 outColor;

#pragma include "common/input.glsl"
#pragma include "common/func.glsl"
#pragma include "common/brdf.glsl"
#pragma include "common/sdf.glsl"
#pragma include "common/noise.glsl"

uniform vec4 Main3DSideRawTex_res;
uniform vec4 Main3DMidRawTex_res;

float Time;

vec4 tex(vec2 uv)
{
    if(IsMid())
    {
        return texture(Main3DMidRawTex, uv);
    }
    else
    {
        return texture(Main3DSideRawTex, uv);
    }
}

float getFocalPlane()
{
    const float lod = 3.0;
    const vec2 focaluv = vec2(0.5, 0.5);
    if(IsMid())
    {
        return textureLod(Main3DMidRawTex, focaluv, lod).a;
    }
    else
    {
        return textureLod(Main3DSideRawTex, focaluv, lod).a;
    }
}

float getcoc(float d, float focalPlane)
{
    // focalLength:焦点距離
    // focalPlane:ピントを合わせたいカメラまでの距離
    const float focalLength = 0.35;
    const float cocScale = 15.0;
    // 開口径
    float aperture = min(1.0, focalPlane * focalPlane);
    float ca = aperture * focalLength * (focalPlane - d);
    float cb = abs(d * (focalPlane - focalLength)) + 1e-9;
    float c = abs(ca / cb) * cocScale;
    return c;
}

// ref: https://blog.42yeah.is/rendering/2023/02/25/dof.html
vec3 render(float t)
{
    Time = t;

    vec2 fc = gl_FragCoord.xy, res = resolution.xy, asp = res / min(res.x, res.y);
    vec2 uv = fc / res;
    vec2 texres = (IsMid() ? Main3DMidRawTex_res.xy : Main3DSideRawTex_res.xy);

    vec3 col = vec3(0);
    float focalPlane = getFocalPlane();
    vec4 uvtex = tex(uv);
    float depth = uvtex.a;
    float coc = getcoc(depth, focalPlane);
    float wsum = 0.0;
    const int N = 64;
    const float SN = sqrt(float(N));
    const float golden = PI * (3.0 - sqrt(5.0));

    for(int i = 0; i < N; i++)
    {
        float fi = float(i);
        float r = coc * sqrt(fi) / SN;
        float th = fi * golden;
        vec2 suv = uv + orbit(th) * r / texres;

        vec4 stex = tex(suv);
        float sd = stex.a;

        if(sd > 0.0)
        {
            float scoc = getcoc(sd, focalPlane);
            float w = max(1e-2, scoc);
            col += stex.rgb * w;
            // col += stex.rgb * w * cloma0(float(i) / float(N));
            wsum += w;
        }
    }
    col /= wsum;

    // hack
    vec2 ssuv = (uv * 2.0 - 1.0) * asp;
    float m = linearstep(0.01, 0.02, length(ssuv));
    // col = mix(uvtex.rgb, col, m);
    // col = uvtex.rgb;

    return col;
}

void main()
{
    vec3 col = render(time);

    outColor = vec4(col, 1);
}