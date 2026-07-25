"use client";
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { InspiraShaderToy, ShaderConfig, MouseMode } from "@/lib/shader-toy";

interface SingularityBackgroundProps {
  className?: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  speed?: number;
  mouseSensitivity?: number;
  damping?: number;
  noise?: {
    opacity: number;
    scale: number;
  };
}

const shader: ShaderConfig = {
  source: `
// ShaderToy URL: https://www.shadertoy.com/view/3csSWB

/*
    "Singularity" by @XorDev

    A whirling blackhole.
    Feel free to code golf!

    FabriceNeyret2: -19
    dean_the_coder: -12
    iq: -4
*/
void mainImage(out vec4 O, vec2 F)
{
  //Iterator and attenuation (distance-squared)
  float i = .2, a;
  //Resolution for scaling and centering
  vec2 r = iResolution.xy,
    //Centered ratio-corrected coordinates
    p = (F + F - r) / r.y / .7,
    //Diagonal vector for skewing
    d = vec2(-1, 1),
    //Blackhole center
    b = p - i * d,
    //Rotate and apply perspective
    c = p * mat2(1, 1, d / (.1 + i / dot(b, b))),
    //Rotate into spiraling coordinates
    v = c * mat2(cos(.5 * log(a = dot(c, c)) + iTime * i + vec4(0, 33, 11, 0))) / i,
    //Waves cumulative total for coloring
    w;

  //Loop through waves
  for (; i++ < 9.; w += 1. + sin(v))
    //Distort coordinates
    v += .7 * sin(v.yx * i + iTime) / i + .5;
  //Acretion disk radius
  i = length(sin(v / .3) * .4 + c * (3. + d));
  //Red/blue gradient
  O = 1. - exp(-exp(c.x * vec4(.6, -.4, -1, 0))
    //Wave coloring
    / w.xyyx
    //Acretion disk brightness
    / (2. + i * i / 4. - i)
    //Center darkness
    / (.5 + 1. / a)
    //Rim highlight
    / (.03 + abs(length(p) - .7))
  );
}
  `,
};

export function SingularityBackground({
  className,
  hue = 0,
  saturation = 1,
  brightness = 1,
  speed = 1,
  mouseSensitivity = 0.5,
  damping = 1,
}: SingularityBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shaderRef = useRef<InspiraShaderToy | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the ShaderToy wrapper
    shaderRef.current = new InspiraShaderToy(
      containerRef.current,
      "hover",
      60,
      window.devicePixelRatio || 1
    );

    shaderRef.current.setShader(shader);
    shaderRef.current.play();

    return () => {
      if (shaderRef.current) {
        shaderRef.current.dispose();
      }
    };
  }, []);

  // Update properties dynamically when props change
  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.setHSV({ hue, saturation, brightness });
    }
  }, [hue, saturation, brightness]);

  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.setSpeed(speed);
    }
  }, [speed]);

  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.setMouseSensitivity(mouseSensitivity);
    }
  }, [mouseSensitivity]);

  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.setMouseDamping(damping);
    }
  }, [damping]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 z-[-1] overflow-hidden bg-black", className)}
    />
  );
}
