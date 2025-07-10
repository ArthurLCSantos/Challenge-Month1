import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { DirectionalLightHelper } from 'three'

export default function DirLight({ intensity, direction, color, helper }) {
  const lightRef = useRef()
  const targetRef = useRef()
  const { scene } = useThree()

  useEffect(() => {
    if (!(lightRef.current || targetRef.current)) return undefined
      lightRef.current.target = targetRef.current
      scene.add(targetRef.current)
  }, [])

  useEffect(() => {
    if (!lightRef.current) return undefined
    const rad = direction * Math.PI / 180
    lightRef.current.position.set(Math.cos(rad) * 5000, 10000, Math.sin(rad) * 5000)
    lightRef.current.intensity = intensity
  }, [intensity, direction])

  useEffect(() => {
    if (!(helper || lightRef.current)) return undefined
    const lightHelper = new DirectionalLightHelper(lightRef.current, 1000)
    scene.add(lightHelper)
    return () => {
      scene.remove(lightHelper)
      lightHelper.dispose?.()
    }
  }, [helper])

  return (
    <>
      <directionalLight
        ref={lightRef}
        castShadow
        color={color}
        shadow-bias={-0.05}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
      <object3D ref={targetRef} position={[0, 0, 0]} />
    </>
  )
}