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
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkCubeAxesActor from '@kitware/vtk.js/Rendering/Core/CubeAxesActor';

import * as d3scale from 'd3-scale';
import * as d3array from 'd3-array';

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
    background: [0.5, 0.5, 0.5],
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

    // --- Correction des dimensions pour rester cohérent
    dimensions[0] -= 1;
    dimensions[1] -= 1;
    dimensions[2] -= 1;
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(...dimensions);
    imageData.setOrigin(...origin);
    imageData.setSpacing(...spacing);

    // --- Associer les scalaires
    if (cell_data.values) {
      // --- Min/Max pour les différentes calculs et pour bien spécifier les intervalles d'intérêts
      const origValues = cell_data.values;
      const dataMin = Math.min(...origValues);
      const dataMax = Math.max(...origValues);

      // --- Choix d'une valeur sentinel en dehors de l'intervalle réel (0..5)
      const MASK = -9999;

      // --- Construction du tableau "masked" : si site==1 => MASK (masqué), sinon garder la valeur
      const maskedValues = new Float32Array(origValues.length);
      for (let i = 0; i < origValues.length; i++) {
        maskedValues[i] = (cell_data.site[i] === 1) ? MASK : origValues[i];
      }

      // --- Création du vtkDataArray à partir de maskedValues (on garde le nom "values")
      const scalars = vtkDataArray.newInstance({
        name: "values",
        numberOfComponents: 1,
        values: maskedValues,
      });
      imageData.getPointData().setScalars(scalars);

      // --- Couleur : définir la colorFunction uniquement sur dataMin..dataMax
      const colorFunction = vtkColorTransferFunction.newInstance();
      colorFunction.addRGBPoint(dataMin, 0, 0, 1);
      colorFunction.addRGBPoint(dataMax, 1, 0, 1);

      // --- Opacité : MASK -> 0 (invisible), tout le reste entre dataMin..dataMax -> 1 (visible)
      const opacityFunction = vtkPiecewiseFunction.newInstance();
      opacityFunction.addPoint(MASK, 0);       // toutes les cellules masquées => totalement transparentes
      opacityFunction.addPoint(dataMin, 1);    // bornes visibles
      opacityFunction.addPoint(dataMax, 1);

      // --- Mapper couleur / opacité
      const volumeMapper = vtkVolumeMapper.newInstance();
      volumeMapper.setInputData(imageData);

      const volume = vtkVolume.newInstance();
      volume.setMapper(volumeMapper);
      volume.getProperty().setInterpolationTypeToNearest();
      volume.getProperty().setRGBTransferFunction(0, colorFunction);
      volume.getProperty().setScalarOpacity(0, opacityFunction);
      volume.getProperty().setScalarOpacityUnitDistance(0, 2);

      renderer.addVolume(volume);

      // --- Barre scalaire
      const scalarBarActor = vtkScalarBarActor.newInstance();
      scalarBarActor.setScalarsToColors(colorFunction);
      scalarBarActor.setAxisLabel('G_values');
      scalarBarActor.setAxisTextStyle({ fontSize: 14, fontColor: 'black' });
      scalarBarActor.setTickTextStyle({ fontColor: "black" });
      scalarBarActor.setAutomated(false);
      scalarBarActor.setBoxSize([0.15, 1.6]);
      scalarBarActor.setBoxPosition([0.85, -0.92]);
      renderer.addActor(scalarBarActor);
    }

    // --- QUADRILLAGE sur le modèle 
    const bounds = imageData.getBounds();
    const cubeAxes = vtkCubeAxesActor.newInstance();
    cubeAxes.setDataBounds(bounds);
    console.log(bounds, spacing)
    function myGenerateTicks(dataBounds) {
      const res = vtkCubeAxesActor.defaultGenerateTicks(dataBounds);
      const scale = d3scale.scaleLinear().domain([dataBounds[0], dataBounds[1]]);
      res.ticks[0] = d3array.range(dataBounds[0], dataBounds[1], spacing[0]);
      res.ticks[1] = d3array.range(dataBounds[2], dataBounds[3], spacing[1]);
      res.ticks[2] = d3array.range(dataBounds[4]+0.25, dataBounds[5]+0.25, spacing[2]);
      const format0 = scale.tickFormat(res.ticks[0].length);
      const format1 = scale.tickFormat(res.ticks[1].length);
      const format2 = scale.tickFormat(spacing[2].length, ".2f");
      res.tickStrings[0] = res.ticks[0].map(format0);
      res.tickStrings[1] = res.ticks[1].map(format1);
      res.tickStrings[2] = res.ticks[2].map(format2);
      return res;
    }

    cubeAxes.setGenerateTicks(myGenerateTicks);
    cubeAxes.setTickTextStyle({ fontSize: 14, fontColor: 'black', style: 'bold' })
    cubeAxes.setAxisTextStyle({ fontSize: 14, fontColor: 'black', style: 'bold' })
    cubeAxes.getProperty().setColor(0,0,0)
    cubeAxes.setCamera(renderer.getActiveCamera());
    renderer.addActor(cubeAxes);
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
      colorFunction.addRGBPoint(minVal, 0, 0, 1);   
      colorFunction.addRGBPoint(maxVal, 1, 0, 1);   

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

      scalarBarActor.setAutomated(false);
      scalarBarActor.setBoxSize([0.15, 1.6]);          
      scalarBarActor.setBoxPosition([0.73, -0.92]); // bord droit (0.98) - largeur
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

  if (scene.topographie && scene.texture3D) {
    const topoBytes = scene.topographie.data;  // tableau d’octets CSV
    const textureData = scene.texture3D;       // { data: base64, type: 'image/png' }

    // --- Convertion du tableau d'octets en texte CSV
    const csvText = new TextDecoder().decode(new Uint8Array(topoBytes));
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
    const topoPoints = lines.slice(1).map((line) => {
      const [x, y, z] = line.split(';').map(Number);
      return { x, y, z };
    });

    // --- Extraction des valeurs uniques pour la grille
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

    // --- Détermination des limites de la grille
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(...scene.grid.dimensions);
    imageData.setOrigin(...scene.grid.origin);
    imageData.setSpacing(...scene.grid.spacing);

    const [xmin, xmax, ymin, ymax, zmin, zmax] = imageData.getBounds();

    // --- Création du plan aligné sur les bounds
    const plane = vtkPlaneSource.newInstance({
      origin: [xmax, ymin, 0],   // bas-droit
      point1: [xmin, ymin, 0],   // bas-gauche
      point2: [xmax, ymax, 0],   // haut-droit
      xResolution: nx - 1,
      yResolution: ny - 1,
    });

    // --- Application les valeurs Z sur les points
    const planePolyData = plane.getOutputData();
    const planePoints = planePolyData.getPoints().getData();

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = i + j * nx;
        planePoints[3 * idx + 2] = pointValues[idx]; // Z
      }
    }

    // --- Création de la texture
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
  const camera = renderer.getActiveCamera();
  const fp = camera.getFocalPoint();
  camera.setPosition(fp[0], fp[1], fp[2] - 250);  // en dessous du volume
  camera.setFocalPoint(...fp);
  camera.setViewUp([0, 1, 0]);  // vertical normal
  renderer.resetCameraClippingRange();
  renderWindow.render();
  console.log('Nombre d’acteurs :', renderer.getActors().length);
});

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