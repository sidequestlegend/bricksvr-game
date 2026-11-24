// Brick Builder's brick shader: upstream's PerInstanceColor.shader (built-in pipeline surface shader, _Color and
// _TexOffset per instance through a MaterialPropertyBlock) remade for URP and the Quest.
//
// Two ways to get a brick's colour:
//  - _ColorFromUV1 = 0: the material's _BaseColor (a held brick, the ghost, the picker tiles: the relay op `color`).
//  - _ColorFromUV1 = 1: the mesh's second UV channel (TEXCOORD1).x holds 0xRRGGBB as a whole number. The chunk renderer
//    merges every placed brick of a chunk into one mesh with Mesh.CombineMeshes(..., hasLightmapData: true), giving each
//    CombineInstance lightmapScaleOffset = (0, 0, rgb, 0): with a zero scale the merged UV1 of that brick's vertices is
//    exactly the offset, so one draw call carries a colour per brick without a MaterialPropertyBlock (not on the
//    graph allow list) and without per-vertex loops in a graph.
// Upstream's scratch overlay (_MainTex, _ScratchWeighting) is left out: its texture is lost (PORT.md 6).
// Lighting: main light (Lambert) plus the ambient probe; no shadows (Quest budget).
Shader "BrickBuilder/BrickColor"
{
    Properties
    {
        _BaseColor ("Color", Color) = (1, 1, 1, 1)
        [Toggle] _ColorFromUV1 ("Colour from UV1 (merged chunks)", Float) = 0
        _Lift ("Ambient lift", Range(0, 1)) = 0.15
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" "Queue" = "Geometry" }

        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            CBUFFER_START(UnityPerMaterial)
                half4 _BaseColor;
                float _ColorFromUV1;
                half _Lift;
            CBUFFER_END

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float2 uv1 : TEXCOORD1;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                half3 albedo : COLOR;
                half3 normalWS : TEXCOORD0;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                float packed = floor(input.uv1.x + 0.5);
                float r = floor(packed / 65536.0);
                float g = floor((packed - r * 65536.0) / 256.0);
                float b = packed - r * 65536.0 - g * 256.0;
                float3 srgb = saturate(float3(r, g, b) / 255.0);
                float3 linearColour = srgb * (srgb * (srgb * 0.305306011 + 0.682171111) + 0.012522878);   // sRGB to linear (Unity's fast form)
                output.albedo = _ColorFromUV1 > 0.5 ? (half3)linearColour : _BaseColor.rgb;
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                half3 n = normalize(input.normalWS);
                Light main = GetMainLight();
                half ndl = saturate(dot(n, main.direction));
                half3 light = main.color * ndl + SampleSH(n) + _Lift;
                return half4(input.albedo * light, 1);
            }
            ENDHLSL
        }

        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On
            ColorMask R

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial)
                half4 _BaseColor;
                float _ColorFromUV1;
                half _Lift;
            CBUFFER_END

            struct Attributes { float4 positionOS : POSITION; UNITY_VERTEX_INPUT_INSTANCE_ID };
            struct Varyings { float4 positionCS : SV_POSITION; UNITY_VERTEX_OUTPUT_STEREO };

            Varyings vert(Attributes input)
            {
                Varyings output;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                return output;
            }

            half frag(Varyings input) : SV_Target { return 0; }
            ENDHLSL
        }
    }
}
