#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 vUV;
out vec4 fragColor;

void main() {
    fragColor = vec4(vUV, 1.0, 1.0);
}
