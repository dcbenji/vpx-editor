const fs = require('fs');
const path = require('path');

const meshDir = '/Users/jmillard/vpx/vpinball-ios/src/meshes';
const outputDir = '/Users/jmillard/vpx/editor/vpx-editor/src/meshes';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function convertMeshFile(fileName, outputName) {
  const inputFile = path.join(meshDir, fileName);
  if (!fs.existsSync(inputFile)) {
    console.log(`Skipping ${fileName}: file not found`);
    return false;
  }

  const content = fs.readFileSync(inputFile, 'utf8');

  const vertexRegex = /\{\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*,\s*([-\d.f]+)\s*\}/g;

  const positions = [];
  const normals = [];
  const uvs = [];

  let match;
  while ((match = vertexRegex.exec(content)) !== null) {
    positions.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    normals.push(parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6]));
    uvs.push(parseFloat(match[7]), parseFloat(match[8]));
  }

  const indexMatch = content.match(/Indices\s*\[\s*\d*\s*\]\s*=\s*\{([^}]+)\}/s);
  let indices = [];
  if (indexMatch) {
    indices = indexMatch[1].split(/[\s,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }

  if (positions.length === 0) {
    console.log(`Skipping ${fileName}: no vertices found`);
    return false;
  }

  const output = {
    positions,
    normals,
    uvs,
    indices
  };

  const outputFile = path.join(outputDir, `${outputName}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(output));

  console.log(`Converted ${outputName}: ${positions.length/3} vertices, ${indices.length} indices`);
  return true;
}

const meshes = [
  ['bumperBaseMesh.h', 'bumperBase'],
  ['bumperCapMesh.h', 'bumperCap'],
  ['bumperRingMesh.h', 'bumperRing'],
  ['bumperSocketMesh.h', 'bumperSocket'],
  ['ballMesh.h', 'ball'],
  ['bulbLightMesh.h', 'bulbLight'],
  ['bulbSocketMesh.h', 'bulbSocket'],
  ['dropTargetT2Mesh.h', 'dropTargetT2'],
  ['dropTargetT3Mesh.h', 'dropTargetT3'],
  ['dropTargetT4Mesh.h', 'dropTargetT4'],
  ['flipperBase.h', 'flipperBase'],
  ['gateBracketMesh.h', 'gateBracket'],
  ['gateLongPlateMesh.h', 'gateLongPlate'],
  ['gatePlateMesh.h', 'gatePlate'],
  ['gateWireMesh.h', 'gateWire'],
  ['gateWireRectangleMesh.h', 'gateWireRectangle'],
  ['hitTargetFatRectangleMesh.h', 'hitTargetFatRectangle'],
  ['hitTargetFatSquareMesh.h', 'hitTargetFatSquare'],
  ['hitTargetRectangleMesh.h', 'hitTargetRectangle'],
  ['hitTargetRoundMesh.h', 'hitTargetRound'],
  ['hitTargetT1SlimMesh.h', 'hitTargetT1Slim'],
  ['hitTargetT2SlimMesh.h', 'hitTargetT2Slim'],
  ['kickerCupMesh.h', 'kickerCup'],
  ['kickerGottlieb.h', 'kickerGottlieb'],
  ['kickerHitMesh.h', 'kickerHit'],
  ['kickerHoleMesh.h', 'kickerHole'],
  ['kickerSimpleHoleMesh.h', 'kickerSimpleHole'],
  ['kickerT1Mesh.h', 'kickerT1'],
  ['kickerWilliams.h', 'kickerWilliams'],
  ['spinnerBracketMesh.h', 'spinnerBracket'],
  ['spinnerPlateMesh.h', 'spinnerPlate'],
  ['triggerButtonMesh.h', 'triggerButton'],
  ['triggerInderMesh.h', 'triggerInder'],
  ['triggerSimpleMesh.h', 'triggerSimple'],
  ['triggerStarMesh.h', 'triggerStar'],
  ['triggerWireDMesh.h', 'triggerWireD'],
];

let converted = 0;
meshes.forEach(([file, name]) => {
  if (convertMeshFile(file, name)) converted++;
});
console.log(`Done! Converted ${converted} meshes.`);
