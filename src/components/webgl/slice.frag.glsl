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

vec3 colormap(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 cold = vec3(0.085, 0.532, 0.201);
    vec3 mid = vec3(0.865, 0.865, 0.865);
    vec3 hot = vec3(0.780, 0.114, 0.114);

    if (t > 0.5) return mix(cold, mid, t * 2.0);
    return mix(mid, hot, (t - 0.5) * 2.0);
}

void main() {
    vec3 uvw = vec3(vUV, u_yplus);
    float pressure = texture(u_pressure, vUV).r;
    vec4 txt_sample = texture(u_velocity, uvw);
    vec3 velocity = txt_sample.rgb;
    float q = txt_sample.a;

    vec3 u = (velocity * 2.0 - 1.0) * u_vel_max;

    float norm = length(u);
    float normMax = u_vel_max * sqrt(3.0);

    if (norm < u_threshold * normMax) {
        fragColor = vec4(0.06, 0.06, 0.08, 1.0);
        return;
    }
    float t = norm / normMax;
    fragColor = vec4(colormap(t), 1.0);
}
