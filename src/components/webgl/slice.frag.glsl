#version 300 es
precision highp float;
precision highp sampler3D;
precision highp sampler2D;

uniform sampler3D u_velocity;

uniform sampler2D u_pressure;

uniform sampler2D u_velocity_colormap;
uniform sampler2D u_pressure_colormap;

uniform float u_yplus;

uniform float u_vel_max;

uniform bool u_vel_cont_enabled;
uniform float u_vel_cont_value;
uniform float u_vel_cont_range;

uniform bool u_pre_cont_enabled;
uniform float u_pre_cont_value;
uniform float u_pre_cont_range;

uniform bool u_q_cont_enabled;
uniform float u_q_cont_value;
uniform float u_q_cont_range;

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

    vec4 q_color = texture(u_velocity_colormap, vec2(0.0, q));

    fragColor = vec4(0.1, 0.1, 0.1, 1.0);

    if (u_vel_cont_enabled) {
        if (abs(length(velocity) - u_vel_cont_value) < u_vel_cont_range) {
            fragColor = velocity_color;
        }
    }

    if (u_pre_cont_enabled) {
        if (abs(pressure - u_pre_cont_value) < u_pre_cont_range) {
            fragColor = pressure_color;
        }
    }

    if (u_q_cont_enabled) {
        if (abs(q - u_q_cont_value) < u_q_cont_range) {
            fragColor = q_color;
        }
    }

    if (!u_vel_cont_enabled && !u_pre_cont_enabled && !u_q_cont_enabled) {
        fragColor = q_color;
    }

    // fragColor = velocity_color;
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
