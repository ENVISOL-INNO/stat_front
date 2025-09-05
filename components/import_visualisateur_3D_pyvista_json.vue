<script setup>
import { ref, onMounted, render } from 'vue'
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkScalarBarActor from '@kitware/vtk.js/Rendering/Core/ScalarBarActor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkWarpScalar from '@kitware/vtk.js/Filters/General/WarpScalar';
import vtkTextureMapToPlane from '@kitware/vtk.js/Filters/Texture/TextureMapToPlane';

const props_from_parent = defineProps({
  jsonContent: {
    type: Object,
    required: true,
  },
});
const vtkContainer = ref(null);

onMounted(() => {
  console.log('Conteneur trouvé ?', vtkContainer.value);
  if (!vtkContainer.value) {
    console.error("Le conteneur VTK n'existe pas encore !");
    return;
  }

  // ------------- Création de la scène initiale
  const scene = props_from_parent.jsonContent.scene;
  console.log("Données de la scène :", scene);

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    rootContainer: vtkContainer.value,
    containerStyle: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    background: [1, 1, 1],
  });

  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  // ------------- Widget pour le repère
  const axes = vtkAxesActor.newInstance();
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: renderWindow.getInteractor(),
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT);
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(50);
  orientationWidget.setMaxPixelSize(100);

  // ------------- Pour l'ajout de la grille de base
  if (scene.grid) {
    const { dimensions, origin, spacing, cell_data } = scene.grid;
    console.log("cell_dtat",cell_data.values)

    // --- Correction des dimensions pour rester cohérent
    dimensions[0] -= 1;
    dimensions[1] -= 1;
    dimensions[2] -= 1;
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(...dimensions);
    imageData.setOrigin(...origin);
    imageData.setSpacing(...spacing);

    // --- Associer les scalaires
    if (cell_data.values){
      const scalars = vtkDataArray.newInstance({
        name: "values",
        numberOfComponents: 1,
        values: new Float32Array(cell_data.values),
      });
      imageData.getPointData().setScalars(scalars);

      // --- Définir min et max pour le rendu
      const values = imageData.getPointData().getScalars().getData();
      const min = Math.min(...values);
      const max = Math.max(...values);
      const colorFunction = vtkColorTransferFunction.newInstance();
      colorFunction.addRGBPoint(min, 1,0,1);
      colorFunction.addRGBPoint(max, 0, 0, 0.8);

      // --- Affichage du volume
      const volumeMapper = vtkVolumeMapper.newInstance();
      volumeMapper.setInputData(imageData);
      const volume = vtkVolume.newInstance();
      volume.setMapper(volumeMapper);
      volume.getProperty().setRGBTransferFunction(0, colorFunction);
      volume.getProperty().setScalarOpacityUnitDistance(0, 2.0);
      renderer.addVolume(volume);

      // --- Barre scalaire
      const scalarBarActor = vtkScalarBarActor.newInstance();
      scalarBarActor.setScalarsToColors(colorFunction);
      scalarBarActor.setAxisLabel('G_values');
      scalarBarActor.setAxisTextStyle({ fontSize: 14, fontColor: 'black' });
      scalarBarActor.setTickTextStyle({fontColor : "black"})
      renderer.addActor(scalarBarActor);
    }

    // --- Grille 3D pour wireframe /!\ NON FINALISE
    const bounds = imageData.getBounds();
    const cubeSource = vtkCubeSource.newInstance({
      xLength: bounds[1]-bounds[0],
      yLength: bounds[3]-bounds[2],
      zLength: bounds[5]-bounds[4],
      center: [
        (bounds[0]+bounds[1])/2,
        (bounds[2]+bounds[3])/2,
        (bounds[4]+bounds[5])/2
      ]
    });

    const cubeMapper = vtkMapper.newInstance();
    cubeMapper.setInputConnection(cubeSource.getOutputPort());

    const cubeActor = vtkActor.newInstance();
    cubeActor.setMapper(cubeMapper);
    cubeActor.getProperty().setRepresentation(1); // wireframe
    cubeActor.getProperty().setColor(0,0,0);
    renderer.addActor(cubeActor);
  }

  // ------------- Pour l'ajout des points en surface
  if (scene.points_surface) {
    const surfacePoints = scene.points_surface.points;

    if (surfacePoints.length > 0) {
      // --- Ajout des points
      const points = vtkPoints.newInstance();
      surfacePoints.forEach((p) => points.insertNextPoint(...p));

      const polyData = vtkPolyData.newInstance();
      polyData.setPoints(points);

      // --- Ajout d'un CellArray pour garantir l'affichage
      const vertices = vtkCellArray.newInstance({
        values: new Uint32Array(surfacePoints.length * 2),
      });
      for (let i = 0; i < surfacePoints.length; i++) {
        vertices.getData()[2 * i] = 1;
        vertices.getData()[2 * i + 1] = i;
      }
      polyData.setVerts(vertices);

      // --- Définition de la taille des points
      const sphereSource = vtkSphereSource.newInstance({
        radius: 5,
        thetaResolution: 16,
        phiResolution: 16,
      });

      // --- Visualisation des points
      const glyphMapper = vtkGlyph3DMapper.newInstance();
      glyphMapper.setInputData(polyData);
      glyphMapper.setSourceConnection(sphereSource.getOutputPort());

      const glyphActor = vtkActor.newInstance();
      glyphActor.setMapper(glyphMapper);
      glyphActor.getProperty().setColor(0, 0, 0);
      glyphActor.getProperty().setPointSize(15)
      glyphActor.getProperty().setOpacity(1.0);
      renderer.addActor(glyphActor);
    }
  }

  // ------------- Pour l'ajout des points en profondeur
  if (scene.points_profondeurs) {
    const profPoints = scene.points_profondeurs.points;
    const pointsValeurs = scene.points_profondeurs.data_points
    // const pointsValeurs = [93.42, 88.68, 88.68, 89.68, 94.07, 93.42, 88.68, 89.68, 94.07, 92.17, 89.165, 89.165, 87.516, 87.516, 94.61, 94.61, 95.924, 95.924, 89.293, 89.293, 85.617, 85.617, 83.186, 83.186, 86.398,86.398, 99.957, 99.957, 98.413, 93.308, 82.394, 82.394, 83.971, 90.116, 90.116, 80.602, 80.602]
    
    if (profPoints.length > 0) {
      // --- Ajout des points
      const points = vtkPoints.newInstance();
      profPoints.forEach((p) => points.insertNextPoint(...p));
      
      const polyData = vtkPolyData.newInstance();
      polyData.setPoints(points);

      // --- Ajout d'un CellArray pour garantir l'affichage
      const vertices = vtkCellArray.newInstance({
        values: new Uint32Array(profPoints.length * 2),
      });
      for (let i = 0; i < profPoints.length; i++) {
        vertices.getData()[2 * i] = 1;
        vertices.getData()[2 * i + 1] = i;
      }
      polyData.setVerts(vertices);

      // --- Scalaire et gestion de la couleur des points
      const scalars = vtkDataArray.newInstance({
        name: 'valeurs',
        numberOfComponents: 1,
        values: new Float32Array(pointsValeurs),
      });
      polyData.getPointData().setScalars(scalars);

      const minVal = Math.min(...pointsValeurs);
      const maxVal = Math.max(...pointsValeurs);
      console.log("Value extrem",minVal, maxVal)

      const colorFunction = vtkColorTransferFunction.newInstance();
      colorFunction.addRGBPoint(minVal, 0, 0, 1);   // bleu pour le minimum
      colorFunction.addRGBPoint(maxVal, 1, 0, 0);   // rouge pour le maximum

      // --- Taille des points
      const sphereSource = vtkSphereSource.newInstance({
        radius: 5,
        thetaResolution: 16,
        phiResolution: 16,
      });

      // --- Visualisation des points 
      const glyphMapper = vtkGlyph3DMapper.newInstance();
      glyphMapper.setInputData(polyData);
      glyphMapper.setSourceConnection(sphereSource.getOutputPort());
      glyphMapper.setColorModeToMapScalars();
      glyphMapper.setScalarModeToUsePointData();
      glyphMapper.setLookupTable(colorFunction);
      glyphMapper.setScalarRange(minVal, maxVal);  // la fonction de transfert définie

      const glyphActor = vtkActor.newInstance();
      glyphActor.setMapper(glyphMapper);
      glyphActor.getProperty().setPointSize(20)
      glyphActor.getProperty().setOpacity(1.0);
      renderer.addActor(glyphActor);

      // --- Visualisation de la barre scalaire
      const scalarBarActor = vtkScalarBarActor.newInstance();
      scalarBarActor.setScalarsToColors(colorFunction);
      scalarBarActor.setAxisLabel('P_values');
      scalarBarActor.setAxisTextStyle({ fontSize: 14, fontColor: 'black' });
      scalarBarActor.setTickTextStyle({fontColor : "black"})
      renderer.addActor(scalarBarActor);
    }
  }

// ------------- Pour l'ajout d'une surface 2D sur la grille
  if (scene.texture2D) {
    const { data, type } = scene.texture2D;

    const image = new Image();
    image.src = `data:${type};base64,${data}`;

    image.onload = () => {
      const texture = vtkTexture.newInstance();
      texture.setImage(image);

      // --- Construire un vtkImageData pour récupérer les bounds
      const imageData = vtkImageData.newInstance();
      imageData.setDimensions(...scene.grid.dimensions);
      imageData.setOrigin(...scene.grid.origin);
      imageData.setSpacing(...scene.grid.spacing);

      const [xmin, xmax, ymin, ymax, zmin, zmax] = imageData.getBounds();
      const z_offset = 0.01 * scene.grid.spacing[2]; // 1% du spacing Z
      const z_top = zmin - z_offset;

      console.log("2D",xmax, xmin)
      // --- Plan collé exactement au dessus de la grille
      const plane = vtkPlaneSource.newInstance({
        origin: [xmax, ymin, z_top],   // bas-droit
        point1: [xmin, ymin, z_top],   // bas-gauche
        point2: [xmax, ymax, z_top],   // haut-droit
        xResolution: 1,
        yResolution: 1,
      });

      const mapper = vtkMapper.newInstance();
      mapper.setInputConnection(plane.getOutputPort());

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      actor.addTexture(texture);

      renderer.addActor(actor);
      renderWindow.render();
    };
  }

  console.log(scene.topographie, scene.texture3D)
  if (scene.topographie && scene.texture3D) {
  const topoBytes = scene.topographie.data;  // tableau d’octets CSV
  const textureData = scene.texture3D;       // { data: base64, type: 'image/png' }

  // --- Convertir le tableau d'octets en texte CSV
  const csvText = new TextDecoder().decode(new Uint8Array(topoBytes));
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
  const topoPoints = lines.slice(1).map((line) => {
    const [x, y, z] = line.split(';').map(Number);
    return { x, y, z };
  });

  // --- Extraire valeurs uniques pour la grille
  const xUnique = [...new Set(topoPoints.map(p => p.x))].sort((a, b) => a - b);
  const yUnique = [...new Set(topoPoints.map(p => p.y))].sort((a, b) => a - b);
  const nx = xUnique.length;
  const ny = yUnique.length;

  // --- Valeurs Z par point
  const pointValues = new Float32Array(nx * ny);
  topoPoints.forEach((p) => {
    const i = xUnique.indexOf(p.x);
    const j = yUnique.indexOf(p.y);
    pointValues[i + j * nx] = -p.z; // inverser Z si nécessaire
  });

  // --- Déterminer les bounds
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(...scene.grid.dimensions);
  imageData.setOrigin(...scene.grid.origin);
  imageData.setSpacing(...scene.grid.spacing);

  const [xmin, xmax, ymin, ymax, zmin, zmax] = imageData.getBounds();

  // --- Créer le plan aligné sur les bounds
  const plane = vtkPlaneSource.newInstance({
    origin: [xmax, ymin, 0],   // bas-gauche
    point1: [xmin, ymin, 0],   // bas-droit
    point2: [xmax, ymax, 0],   // haut-gauche
    xResolution: nx - 1,
    yResolution: ny - 1,
  });

  // --- Appliquer les valeurs Z sur les points
  const planePolyData = plane.getOutputData();
  const planePoints = planePolyData.getPoints().getData();

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = i + j * nx;
      planePoints[3 * idx + 2] = pointValues[idx]; // Z
    }
  }

  // --- Créer la texture
  const img = new Image();
  img.src = `data:${textureData.type};base64,${textureData.data}`;
  img.onload = () => {
    const texture = vtkTexture.newInstance();
    texture.setImage(img);

    const mapper = vtkMapper.newInstance();
    mapper.setInputData(planePolyData);

    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.addTexture(texture);

    renderer.addActor(actor);
    renderWindow.render();
  };
}


  renderer.resetCamera();
  // autoZoom(renderer)
  renderWindow.render();
  console.log('Nombre d’acteurs :', renderer.getActors().length);
});

// function autoZoom(renderer, targetSize = 100) {
//   const bounds = renderer.computeVisiblePropBounds();
//   const xSize = bounds[1] - bounds[0];
//   const ySize = bounds[3] - bounds[2];
//   const zSize = bounds[5] - bounds[4];
//   const maxSize = Math.max(xSize, ySize, zSize);

//   if (maxSize > 0) {
//     const factor = maxSize / targetSize;
//     renderer.getActiveCamera().zoom(factor);
//   }
// }
</script>

<template>
  <div ref="vtkContainer" class="vtk-viewer" style="width:80wh; height:80vh;"></div>
</template>

<style scoped>
.vtk-viewer {
  width: 100%;
  height: 80vh;
  background: black;
}
</style>