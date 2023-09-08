#pragma once

// https://github.com/slerpyyy/sh4der-jockey/blob/main/docs/readme_jp.md#%E5%85%B1%E9%80%9Auniform

// ターゲットの解像度
uniform vec4 resolution; // vec4(x, y, x/y, y/x)

// ステージのインデックス
// 同じシェーダーを複数回実行する場合に便利かもしれません
uniform int pass_index;

// プログラム起動時からの秒数
// uniform float time;

// 前フレームからの経過時間
uniform float time_delta;

// beat == time * BPM / 60
// BPMはコントロールパネルから設定できます。
uniform float beat;

// コントロールパネルにあるスライダーの値に対応します
uniform float sliders[32];

// コントロールパネルにあるボタンに対応します
// buttons[i] = vec4(intensity, since_last_on, since_last_off, count);
// intensity: NoteOnのvelocityとPolyphonicKeyPressureの値が書き込まれます
// since_last_on: 直近の NoteOn からの経過秒数
// since_last_off: 直近の NoteOff からの経過秒数
// count: NoteOnが何回発行されたかを数え上げる整数値
uniform vec4 buttons[32];

// 32x32x32の乱数テキスチャ。
// パイプラインが読み込まれるたびに再計算されるので
// 　コンパイルなどを走らせるとテキスチャの中身が変わります。
uniform sampler3D noise;

// プログラム開始からのフレーム数
uniform int frame_count;

// オーディオ入力デバイスからの生サンプル.
// r には左チャンネル (モノラルの場合は唯一)　の情報が入ります
// g には右チャンネルの情報が入ります
uniform sampler1D samples;

// 生FFT情報
// r/g は上記と同じく
uniform sampler1D spectrum_raw;

// "いい感じ"なFFT、EQをかけたり音階にゆるく対応しています。
// r/g は上記の同じく
uniform sampler1D spectrum;
uniform sampler1D spectrum_smooth;
uniform sampler1D spectrum_integrated;
uniform sampler1D spectrum_smooth_integrated;

// Bass/Mid/High
uniform vec3 bass;
uniform vec3 bass_smooth;
uniform vec3 bass_integrated;
uniform vec3 bass_smooth_integrated;

uniform vec3 mid;
uniform vec3 mid_smooth;
uniform vec3 mid_integrated;
uniform vec3 mid_smooth_integrated;

uniform vec3 high;
uniform vec3 high_smooth;
uniform vec3 high_integrated;
uniform vec3 high_smooth_integrated;

// 現在の音量, 全サンプルのRMSで計算されてます
// r には左右の平均値、モノラルの場合は音量が入ります
// g には左チャンネルの音量が入ります
// b には右チャンネルの音量が入ります
uniform vec3 volume;
uniform vec3 volume_integrated;

// Render Textures -----------------------------------------------------------

/*
stages:
  - fs: "shader/floor_display.frag"
    resolution: [1280,360]
    target: "FloorTex"
  - fs: "shader/side_display.frag"
    resolution: [1280,360]
    target: "SideTex"
  - fs: "shader/mid_display.frag"
    resolution: [640,1080]
    target: "MidTex"
  - fs: "shader/unite.frag"
    resolution: [1920,1080]
    target: "UniteTex"
  - fs: "shader/final_out.frag"
    resolution: [1920,1080]
ndi:
  - source: "GirlTrain"
    name: "GirlTrainTex"
  - source: "Snow"
    name: "SnowTex"
*/

// Other
uniform sampler2D TimeTex;
uniform sampler2D FlyerTex;
uniform sampler2D SideTekitouTex;
uniform sampler2D WiretapTex;

// Target
uniform sampler2D Max3DSideTex;
uniform sampler2D Max3DMidTex;
uniform sampler2D Main3DSideRawTex;
uniform sampler2D Main3DMidRawTex;
uniform sampler2D Main3DSideTex;
uniform sampler2D Main3DMidTex;
uniform sampler2D AcidSideTex;
uniform sampler2D AcidMidTex;
uniform sampler2D FloorTex;
uniform sampler2D SideTex;
uniform sampler2D MidTex;
uniform sampler2D UniteTex;
uniform sampler2D BeatTex;

// NDI
uniform sampler2D GirlTrainTex;
uniform sampler2D SnowTex;

// Input Mapping -------------------------------------------------------------

bool IsMid()
{
  return resolution.y > resolution.x;
}

// Button
// vec4(intensity, since_last_on, since_last_off, count);
/*
0: Beat
*/
#define beatBT buttons[0]
#define beatCount int(beatBT.w+0.5)
/*
1: phase
2: phase minus(間違えちゃったとき用)
*/
#define phaseBT buttons[1]
#define phaseCount (int(endBT.w)%2 ==0?int(phaseBT.w+0.5-buttons[2].w)%9:0)
/*
3: Camera
*/
#define cameraBT buttons[3]
#define cameraCount int(cameraBT.w+0.5)
/*
4: TikaTika
*/
#define tikaTikaBT buttons[4]
#define tikaTikaCount int(tikaTikaBT.w+0.5)
/*
5: End
*/
#define endBT buttons[5]
#define endCount int(endBT.w+0.5)

// Slider
/*
0: Time Speed
*/
#define timeSpeed sliders[0]*10.0
// #define timeSpeed 1.0
#define time texture(TimeTex,vec2(0.5)).x
#define AbsTime texture(TimeTex,vec2(0.5)).y
/*
1: Phase Gain
*/
#define phaseGain (phaseBT.y<3.0?0.0:sliders[1])
/*
2: EMA
*/
#define EMA sliders[2]
/*
3: VHS
*/
#define VHS sliders[3]

#define IsEye (int(beatBT.w+1.5)%16==0)
// #define IsEye (true)
#define EyeCount int(int(beatBT.w+1.5)/16)