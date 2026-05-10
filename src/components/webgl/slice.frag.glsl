#version 300 es
precision highp float;
precision highp sampler3D;
precision highp sampler2D;

uniform sampler3D u_velocity;

uniform sampler2D u_pressure;

uniform sampler2D u_velocity_colormap;
uniform sampler2D u_pressure_colormap;

uniform float u_yplus;

uniform float u_opacity;

uniform float u_vel_max;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec3 uvw = vec3(vUV, u_yplus);
    float pressure = (texture(u_pressure, vUV).r + 1.0) / 2.0;
    vec4 txt_sample = texture(u_velocity, uvw);

    vec3 velocity = txt_sample.rgb;
    float q = txt_sample.a;

    vec4 velocity_color = texture(u_velocity_colormap, vec2(0.0, length(velocity)));

    vec4 pressure_color = texture(u_pressure_colormap, vec2(0.0, pressure));

    fragColor = velocity_color * u_opacity + pressure_color * (1.0 - u_opacity);

    // vec3 u = (velocity * 2.0 - 1.0) * u_vel_max;

    // float norm = length(u);
    // float normMax = u_vel_max * sqrt(3.0);

    // if (norm < u_threshold * normMax) {
    //     fragColor = vec4(0.06, 0.06, 0.08, 1.0);
    //     return;
    // }
    // float t = norm / normMax;
    // fragColor = vec4(pressure, pressure, pressure, 1.0);
}
