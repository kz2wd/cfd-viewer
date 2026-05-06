#version 300 es
precision highp float;
precision highp sampler3D;
precision highp sampler2D;

uniform sampler3D u_velocity;

uniform sampler2D u_pressure;

uniform float u_yplus;

uniform float u_threshold;

uniform float u_vel_max;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec3 uvw = vec3(vUV, u_yplus);
    float pressure = texture(u_pressure, vUV).r;
    vec4 txt_sample = texture(u_velocity, uvw);
    vec3 velocity = txt_sample.rgb;
    float q = txt_sample.a;

    fragColor = vec4(pressure, 0, 0, 1.0);
}
