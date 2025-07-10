import React, { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import DirLight from './DirLight'
import Terrain from './Terrain'

export default function Scene(props) {
  const {
    directionalLightIntensity, directionalLightDirection, directionalLightColor, directionalLightHelper,
    ambientLightIntensity, ambientLightColor,
    quantX, quantY, maxHeight, scale, terrainColor, wireframe,
    velX, velY, velZ, noiseList
  } = props

  const ambientRef = useRef()

  useEffect(() => {
    if (!ambientRef.current) return undefined
    ambientRef.current.intensity = ambientLightIntensity
  }, [ambientLightIntensity])

  return (
    <Canvas
      shadows
      camera={{ position: [10000, 10000, 10000], fov: 60, far: 10e10 }}
      style={{ background: 'transparent' }}
    >
      <OrbitControls enablePan={false} />
      <ambientLight ref={ambientRef} color={ambientLightColor} />
      <DirLight
        intensity={directionalLightIntensity}
        direction={directionalLightDirection}
        color={directionalLightColor}
        helper={directionalLightHelper}
      />
      <Terrain
        position={[0, -10, 0]}
        quantX={quantX}
        quantY={quantY}
        maxHeight={maxHeight}
        scale={scale}
        color={terrainColor}
        wireframe={wireframe}
        velX={velX}
        velY={velY}
        velZ={velZ}
        noiseList={noiseList}
      />
    </Canvas>
  )
}