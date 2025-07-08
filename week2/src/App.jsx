import {createRoot } from 'react-dom/client'
import React, { useState, useRef, useEffect , useMemo, memo} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import './App.css'
import { DoubleSide, BufferAttribute, BufferGeometry, DirectionalLightHelper, Color } from 'three'
import { randInt } from 'three/src/math/MathUtils.js'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
const Terrain = memo((props) => {
  const {position, quantX, quantY, maxHeight, scale, color, wireframe, velX, velY, velZ, noiseList} = props;
  
  const positions = useRef();
  const indices = createIndex()
  const xoffset = useRef(0);
  const yoffset = useRef(0);
  const zoffset = useRef(0);
  const [geometry, setGeometry] = useState(null);
  const meshRef = useRef();

  function sumNoises(x,y) {
    let sum = 0
    noiseList.forEach(noise => {
      sum += myNoise(noise,x,y)
    });
    return sum
  }

  function myNoise(noise,x,y) {
    return noise.noise.noise3d((x+xoffset.current)*10**noise.mod,(y+yoffset.current)*10**noise.mod,zoffset.current*10**noise.mod)*maxHeight*scale;
  
  }

  function createIndex() {
    const ind = []
    for (let y = 0; y < quantY - 1; y++) {
      for (let x = 0; x < quantX - 1; x++) {
        const i = y * quantX + x; // fixed here
        ind.push(i, i + 1, i + quantX + 1);
        ind.push(i + quantX + 1, i + quantX, i);
      }
    }
    return ind
  }

  function createPosition() {
    if (!positions.current || positions.current.length !== quantX * quantY * 3) {
      positions.current = new Float32Array(quantX * quantY * 3);
    }
    for (let y = 0; y < quantY; y++) {
      for (let x = 0; x < quantX; x++) {
        const i = (y * quantX + x) * 3;
        positions.current[i    ] = (x-quantX/2) * scale;
        positions.current[i + 1] = sumNoises(x,y);
        positions.current[i + 2] = (y - quantY / 2) * scale;
      }
    }
  }

  function updateHeight() {
    if (!positions.current) return
    for (let v = 0; v < quantX * quantY; v++) {
      const x = v % quantX;
      const y = Math.floor(v / quantX);
      const i = v * 3 + 1; // y coordinate index
      positions.current[i] = sumNoises(x,y);
    }
  }

  function createGeo() {
    createPosition();
    createIndex()
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions.current, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  function updateGeo() {
    if (!meshRef.current) return;
    const attr = meshRef.current.geometry.attributes.position;
    attr.array.set(positions.current);
    attr.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  }
  
  useFrame(() => {
    if (velX == 0 && velY == 0 && velZ == 0) return
    xoffset.current += 0.5*velX;
    yoffset.current += 0.5*velY;
    zoffset.current += 0.5*velZ;
    updateHeight();
    updateGeo()
  });

  useEffect(()=>{
    const newGeo = createGeo();
    setGeometry(newGeo);
  }, [quantX,quantY,scale])

  useEffect(()=>{
    updateHeight()
    updateGeo()
  }, [maxHeight,noiseList])

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial color={color} side={DoubleSide} wireframe={wireframe} />
    </mesh>
  );
});

// ---------- DirLight (rotating directional light) ----------
const DirLight = ({ intensity, direction, color, helper }) => {
  const lightRef = useRef()
  const targetRef = useRef()
  const { scene } = useThree()

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current
      scene.add(targetRef.current)
    }
  }, [scene])

  useEffect(() => {
    if (!lightRef.current) return
      lightRef.current.intensity = intensity
  }, [intensity])

  useEffect(() => {
    if (!lightRef.current) return
    const rad = direction* (Math.PI / 180);
    lightRef.current.position.x = Math.cos(rad)*5000
    lightRef.current.position.z = Math.sin(rad)*5000
  }, [direction])

  useEffect(() => {
    if (!helper || !lightRef.current) return

    const lightHelper = new DirectionalLightHelper(lightRef.current, 1000, 0xffffff)
    scene.add(lightHelper)

    return () => {
      scene.remove(lightHelper)
      lightHelper.dispose?.()
    }
  }, [direction, helper, scene])

  return (
    <>
      <directionalLight ref={lightRef}
        position={[5000, 10000, 0]}
        color={color}
        castShadow
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

// ---------- Scene (Canvas + objects) ----------
const Scene = memo((props) => {
  const {
    directionalLightIntensity,
    directionalLightDirection,
    directionalLightColor,
    directionalLightHelper,
    ambientLightIntensity,
    ambientLightColor,
    quantX,
    quantY,
    maxHeight,
    scale,
    terrainColor,
    wireframe,
    velX,
    velY,
    velZ,
    noiseList
  } = props
  const ambientLightRef = useRef()

  useEffect(() => {
    if (!ambientLightRef.current) return
      ambientLightRef.current.intensity = ambientLightIntensity
  }, [ambientLightIntensity])

  return (
    <Canvas
      shadows
      camera={{ position: [10000, 10000, 10000], fov: 60, far: 10e10 }}
      gl={{ alpha: true }}
      onCreated={({ gl }) => gl.setClearColor('black', 0.3)}
      style={{ background: 'transparent' }}
      className="rounded-l-4xl"
    >
      <OrbitControls enablePan={false} />
      <ambientLight ref={ambientLightRef} color={ambientLightColor} />
      <DirLight intensity={directionalLightIntensity} direction={directionalLightDirection} color={directionalLightColor} helper={directionalLightHelper} />
      <Terrain
      position ={[0, -10, 0]}
      quantX   ={quantX}
      quantY   ={quantY}
      maxHeight={maxHeight}
      scale    ={scale}
      velX     ={velX}
      velY     ={velY}
      velZ     ={velZ}
      color    ={terrainColor}
      wireframe={wireframe}

      noiseList={noiseList}
      />
    </Canvas>
  )
})

// ---------- Main App (with UI) ----------
function App() {

  const [page, setPage] = useState(0)
  const lightsPage    =   useRef()
  const terrainPage   =   useRef()
  const noisePage     =   useRef()
  const animationPage =   useRef()
  const pages         =   [lightsPage,terrainPage,noisePage,animationPage]
  useEffect(()=>{
    for (let p in pages) {
      pages[p].current.style.display = p == page ? 'block' : 'none'
    }
  }, [page])


  const wireframeInput             = useRef()
  const lightHelperInput           = useRef()

  // lights
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(2.0)
  const [directionalLightDirection, setDirectionalLightDirection] = useState(1)
  const [directionalLightColor, setDirectionalLightColor]         = useState('white');
  const [directionalLightHelper, setDirectionalLightHelper]       = useState(false)
  
  const [ambientLightIntensity, setAmbientLightIntensity]         = useState(1.0)
  const [ambientLightColor, setAmbientLightColor]                 = useState('white');

  // terrain
  const [quantX,       setQuantX]       = useState(300);
  const [quantY,       setQuantY]       = useState(300);
  const [maxHeight,    setMaxHeight]    = useState(10);
  const [scale,        setScale]        = useState(50)
  const [terrainColor, setTerrainColor] = useState('green');
  const [wireframe,    setWireframe]    = useState(false)

  // animation
  const [velocityX, setVelocityX] = useState(10);
  const [velocityY, setVelocityY] = useState(0);
  const [velocityZ, setVelocityZ] = useState(0);

  // noise
  const nextNoiseId = useRef(0)
  const [noiseSelected, setNoiseSelected] = useState(false)
  const [noiseList, setNoiseList] = useState([])
  const nomeInput = useRef()
  const [editNome,setEditNome] = useState('')
  const seedInput = useRef()
  const [editSeed,setEditSeed] = useState('')
  const modInput  = useRef()
  const [editMod,setEditMod] = useState(-2)

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
      return hash;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  function createNoise(){
    const seed = randInt(0,999999999).toString()
    const newNoise = {
      id: nextNoiseId.current++,
      nome: "layer " + nextNoiseId.current,
      seed: seed,
      mod:  -2,
      noise: new SimplexNoise({random: mulberry32(hashCode(seed))})
    }

    setNoiseList((prev) => [...prev, newNoise])
    setNoiseSelected(newNoise.id)
  }

  function updateNoise(){
    if (!editNome || !editSeed || !editMod) return;

    const updated = {
      id: noiseSelected,
      nome: editNome,
      seed: editSeed,
      mod:  parseFloat(editMod),
      noise: new SimplexNoise({ random: mulberry32(hashCode(editSeed)) })
    };

    setNoiseList((oldNoiseList) =>
      oldNoiseList.map((noise) => (noise.id === noiseSelected ? updated : noise))
    );

    changeValues(updated.nome, updated.seed, updated.mod)
  }

  function deleteNoise(e,id){
    e.stopPropagation();
    setNoiseList((oldN)=>oldN.filter((n)=>n.id!=id)); 
    if (noiseList.length == 1) setNoiseSelected(false)
    console.log(noiseList)
  }

  function changeValues(nome,seed,mod){
    nomeInput.current.value = nome
    seedInput.current.value = seed
    modInput.current.value =  mod
    setEditNome(nome)
    setEditSeed(seed)
    setEditMod(mod)
  }

  function changeCheckboxesColor(ref, val) {
    if (!ref.current) return
    ref.current.style.backgroundColor = val ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,0)'
  }

  useEffect(()=>{updateNoise()},[editNome,editSeed,editMod])

  useEffect(()=>{
    createNoise()
  }, [])

  useEffect(()=>{
    if (!nomeInput.current || !seedInput.current || !modInput.current) return
    
    if (noiseSelected !== false) {
      const noise = noiseList.find((n)=>n.id===noiseSelected)
      changeValues(noise.nome, noise.seed, noise.mod)
    } else {
      changeValues('','',0)
    }
  }, [noiseSelected])

  useEffect(()=>{
    changeCheckboxesColor(wireframeInput,  wireframe)
  },[wireframe])

  useEffect(()=> {
    changeCheckboxesColor(lightHelperInput,directionalLightHelper)
  }, [directionalLightHelper])

  return (
    <div className="flex w-full h-full bg-blue-950 p-10">
      {/* SCENE */}
      <Scene
        directionalLightIntensity={directionalLightIntensity}
        directionalLightDirection={directionalLightDirection}
        directionalLightColor={directionalLightColor}
        directionalLightHelper={directionalLightHelper}

        ambientLightIntensity={ambientLightIntensity}
        ambientLightColor={ambientLightColor}

        quantX={quantX}
        quantY={quantY}
        maxHeight={maxHeight}
        scale={scale}
        terrainColor={terrainColor}
        wireframe={wireframe}

        velX={velocityX}
        velY={velocityY}
        velZ={velocityZ}

        noiseList={noiseList}
      />

      {/* CONTROLS */}
      <div className="rounded-r-4xl flex flex-col gap-4 w-xl h-full text-white" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        {/* PAGE MENU */}
        <div className='bg-black flex w-full h-1/12 rounded-tr-4xl'>
            <label className='w-full h-full flex justify-center items-center border-1 border-gray-600 hover:bg-blue-900'>
              <input type='radio' name='pages' className='hidden' onChange={(e)=>setPage(0)} />
              <p className='text-xl font-bold'>Lights</p>
            </label>
            <label className='w-full h-full flex justify-center items-center border-1 border-gray-600 hover:bg-blue-900'>
              <input type='radio' name='pages' className='hidden' onChange={(e)=>setPage(1)} />
              <p className='text-xl font-bold'>Terrain</p>
            </label>
            <label className='w-full h-full flex justify-center items-center border-1 border-gray-600 hover:bg-blue-900'>
              <input type='radio' name='pages' className='hidden' onChange={(e)=>setPage(2)} />
              <p className='text-xl font-bold'>Noise</p>
            </label>
            <label className='w-full h-full flex justify-center items-center border-1 border-gray-600 hover:bg-blue-900 rounded-tr-4xl'>
              <input type='radio' name='pages' className='hidden' onChange={(e)=>setPage(3)} />
              <p className='text-xl font-bold'>Animation</p>
            </label>
        </div>

        {/* LIGHTS */}
        <div ref={lightsPage} className="hidden p-4 rounded-4xl">
            {/* DIRECTIONAL LIGHT */}
            {/* DIRECTIONAL LIGHT INTENSITY */}
            <h1 className='font-bold text-2xl'>Directional Light</h1>
            <p className="text-xl">Light intensity</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/3">
              <input
                type="range"
                value={directionalLightIntensity}
                min={0}
                max={20}
                step={0.1}
                className="range-thumb"
                onChange={(e) =>
                  setDirectionalLightIntensity(parseFloat(e.target.value))
                }
              />
              <p>{directionalLightIntensity}</p>
            </div>
            
            {/* DIRECTIONAL LIGHT DIRECTION */}
            <p className="text-xl">Light direction</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/3">
              <input
                type="range"
                value={directionalLightDirection}
                min={0}
                max={360}
                step={1}
                className="range-thumb"
                onChange={(e) =>
                  setDirectionalLightDirection(parseInt(e.target.value))
                }
              />
              <p>{directionalLightDirection}</p>
            </div>
            
            <div className='flex items-center justify-between'>
              {/* DIRECTIONAL LIGHT COLOR */}
              <div>
                <p className="text-xl">Color</p>
                <div className='w-30 h-30 rounded-4xl border-2 border-blue-200' style={{backgroundColor: directionalLightColor}}>
                  <input type="color" className='opacity-0 w-full h-full' onChange={(e)=>setDirectionalLightColor(e.target.value)} />
                </div>
              </div>

              {/* DIRECTIONAL LIGHT HELPER */}
              <div className='flex items-center gap-5'>
                <p className="text-xl">helper</p>
                <div ref={lightHelperInput} className='w-10 h-10 border-2 rounded-xl'>
                  <input type='checkbox' className='opacity-0 w-full h-full' onClick={()=>setDirectionalLightHelper((h)=>!h)}/>
                </div>
              </div>
            </div>

            <hr className='opacity-50 w-3/4 mt-5'></hr>

            <h1 className='font-bold text-2xl'>Ambient Light</h1>
            {/* AMBIENT LIGHT */}
            <p className="text-xl">Ambient light intensity</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/3">
              <input
                type="range"
                value={ambientLightIntensity}
                min={0}
                max={20}
                step={0.1}
                className="range-thumb"
                onChange={(e) =>
                  setAmbientLightIntensity(parseFloat(e.target.value))
                }
              />
              <p>{ambientLightIntensity}</p>
            </div>

            <p className="text-xl">Color</p>
            <div className='w-30 h-30 rounded-4xl border-2 border-blue-200' style={{backgroundColor: ambientLightColor}}>
              <input type="color" className='opacity-0 w-full h-full' onChange={(e)=>setAmbientLightColor(e.target.value)} />
            </div>

        </div>
        {/* TERRAIN */}
        <div ref={terrainPage} className="hidden p-4 rounded-4xl">

          <h1 className='font-bold text-2xl'>Terrain size</h1>
          <div className='flex w-full items-center gap-5'>
            {/* TERRAIN WIDTH */}
            <div className="flex flex-col gap-1.5 w-full">
              <p className="text-xl">Width</p>
              <input
                type="range"
                value={quantX}
                min={0}
                max={500}
                step={1}
                className="range-thumb"
                onChange={(e)=> setQuantX(parseInt(e.target.value))}
              />
              <p>{quantX}</p>
            </div>

            {/* TERRAIN DEPTH */}
            <div className='flex flex-col gap-1.5 w-full'>
              <p className="text-xl">Depth</p>
              <div className="flex flex-col gap-1.5 rounded-full w-full">
                <input
                  type="range"
                  value={quantY}
                  min={0}
                  max={500}
                  step={1}
                  className="range-thumb"
                  onChange={(e)=> setQuantY(parseInt(e.target.value))}
                />
                <p>{quantY}</p>            
              </div>
            </div>

            {/* TERRAIN HEIGHT */}
            <div className='flex flex-col gap-1.5 w-full'>
              <p className="text-xl">Height</p>
              <div className="flex flex-col gap-1.5 rounded-full w-full">
                <input
                  type="range"
                  value={maxHeight}
                  min={0}
                  max={100}
                  step={0.1}
                  className="range-thumb"
                  onChange={(e)=> setMaxHeight(parseFloat(e.target.value))}
                />
                <p>{maxHeight}</p>
              </div>
            </div>
          </div>

          {/* TERRAIN SCALE */}
          <div className='flex flex-col gap-1.5 w-1/2'>
            <p className="text-xl">Scale</p>
            <div className="flex flex-col gap-1.5 rounded-full w-full">
              <input
                type="range"
                value={scale}
                min={0}
                max={100}
                step={0.01}
                className="range-thumb"
                onChange={(e)=> setScale(parseFloat(e.target.value))}
              />
              <p>{scale}</p>
            </div>
          </div>

          <hr className='opacity-50 w-3/4 mt-5'></hr>
          
          {/* TERRAIN VISUAL */}
          <h1 className='font-bold text-2xl'>Terrain visual</h1>
          <div className='flex items-center justify-between'>
            {/* TERRAIN COLOR */}
            <div>
              <p className="text-xl">Color</p>
              <div className='w-30 h-30 rounded-4xl border-2 border-blue-200' style={{backgroundColor: terrainColor}}>
                <input type="color" className='opacity-0 w-full h-full' onChange={(e)=>setTerrainColor(e.target.value)} />
              </div>
            </div>
            {/* TERRAIN WIREFRAME */}
            <div className='flex items-center gap-5'>
              <p className="text-xl">wireframe</p>
              <div ref={wireframeInput} className='w-10 h-10 border-2 rounded-xl'>
                <input type='checkbox' className='opacity-0 w-full h-full' onClick={()=>setWireframe((w)=>!w)} />
              </div>
            </div>
          </div>

        </div>
        {/* NOISE */}
        <div ref={noisePage} className='hidden p-4 rounded-4xl h-full overflow-y-scroll'>
          {noiseList.length > 0 ? <div className='flex flex-col gap-5'>
          {/* NOISE NAME */}
          <div className='flex flex-col'>
            <p>Name</p>
            <input disabled={noiseSelected === false ? true : false} ref={nomeInput} type='text' onChange={(e)=> setEditNome(e.target.value)} className='w-full h-10 border-2 border-gray-50 rounded-lg'></input>
          </div>
          
          {/* NOISE SEED */}
          <div>
            <p>Seed</p>
            <div className='flex items-center justify-center gap-5'>
              <input disabled={noiseSelected === false ? true : false} ref={seedInput} type='text' onChange={(e)=> setEditSeed(e.target.value)} className='w-full h-10 border-2 border-gray-50 rounded-lg'></input>
              <button disabled={noiseSelected === false ? true : false} className='bg-gray-50 rounded-lg text-black' onClick={()=>changeValues(editNome, randInt(0,999999).toString(), editMod)}>Random Seed</button>
            </div>
          </div>
          
          {/* NOISE SMOOTHNESS */}
          <p className="text-xl">Noise smoothness</p>
          <div className="flex flex-col gap-1.5 rounded-full w-1/3">
            <input
              disabled={noiseSelected === false ? true : false}
              ref={modInput}
              type="range"
              value={editMod}
              min={-3}
              max={0.25}
              step={0.01}
              className="range-thumb"
              onChange={(e) => {setEditMod(e.target.value)}}
            />
            <p>{editMod}</p>
          </div>
          </div> : <></>}
          
          <div className='flex flex-col h-full gap-5'>
              {/* NOISE CREATE */}
              <div className='flex justify-center items-center w-full h-20 bg-green-800 rounded-xl p-2 hover:cursor-pointer' onClick={createNoise}>
                <p className='text-white text-4xl'> Create </p>
              </div>

              {noiseList.map((noise)=>{
              return <div key={noise.id} className='flex justify-between w-full bg-gray-800 rounded-xl p-2' style={{backgroundColor: noiseSelected === noise.id ? '#1c398e' : '#1e2939'}} onClick={()=>{noise.id === noiseSelected ? setNoiseSelected(false) : setNoiseSelected(noise.id)}}>
                        <div className='block w-full mr-2'>
                          <h1 className='font-bold'>{noise.nome}</h1>
                          <div className='flex gap-5 opacity-80 justify-between'>
                            <p>seed:{noise.seed}</p>
                            <p>smoothness:{noise.mod}</p>
                          </div>
                        </div>

                      <div className='flex'>
                        <div className='w-15 h-full bg-rose-950 hover:cursor-pointer' onClick={(e)=>deleteNoise(e,noise.id)}></div>
                      </div>
                    </div>
              })}
            </div>
        </div>
        {/* ANIMATION */}
        <div ref={animationPage} className='hidden p-4 rounded-4xl pages'>
          {/* TERRAIN VELOCITY X */}
          <div className='w-full'>
            <p className="text-xl">Velocity X</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/2">
              <input
                type="range"
                value={velocityX}
                min={-20}
                max={20}
                step={1}
                className="range-thumb"
                onChange={(e)=> setVelocityX(parseInt(e.target.value))}
              />
              <p>{velocityX}x</p>
            </div>
          </div>

          {/* TERRAIN VELOCITY Y */}
          <div className='w-full'>
            <p className="text-xl">Velocity Y</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/2">
              <input
                type="range"
                value={velocityY}
                min={-20}
                max={20}
                step={1}
                className="range-thumb"
                onChange={(e)=> setVelocityY(parseInt(e.target.value))}
              />
              <p>{velocityY}x</p>
            </div>
          </div>

          {/* TERRAIN VELOCITY Z */}
          <div className='w-full'>
            <p className="text-xl">Velocity Z</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/2">
              <input
                type="range"
                value={velocityZ}
                min={-20}
                max={20}
                step={1}
                className="range-thumb"
                onChange={(e)=> setVelocityZ(parseInt(e.target.value))}
              />
              <p>{velocityZ}x</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App