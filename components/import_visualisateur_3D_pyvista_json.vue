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
import vtkTextActor from '@kitware/vtk.js/Rendering/Core/TextActor';
import vtkCubeAxesActor from '@kitware/vtk.js/Rendering/Core/CubeAxesActor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkSphereMapper from '@kitware/vtk.js/Rendering/Core/SphereMapper'
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';

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


  // // -------------- Pour l'ajout de la grille de base
  if (scene.grid) {
    const { dimensions, origin, spacing, cell_data } = scene.grid;
    console.log("cell_dtat",cell_data.values)

    // ----------- Correction des dimensions pour rester cohérent
    dimensions[0] -= 1;
    dimensions[1] -= 1;
    dimensions[2] -= 1;
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(...dimensions);
    imageData.setOrigin(...origin);
    imageData.setSpacing(...spacing);

    // ----------- Associer les scalaires
    if (cell_data.values){
      const scalars = vtkDataArray.newInstance({
        name: "values",
        numberOfComponents: 1,
        values: new Float32Array(cell_data.values),
      });
      imageData.getPointData().setScalars(scalars);

      // ----------- Définir min et max pour le rendu
      const values = imageData.getPointData().getScalars().getData();
      const min = Math.min(...values);
      const max = Math.max(...values);
      const colorFunction = vtkColorTransferFunction.newInstance();
      colorFunction.addRGBPoint(min, 1,0,1);
      colorFunction.addRGBPoint(max, 0, 0, 0.8);

      // ----------- Affichage du volume
      const volumeMapper = vtkVolumeMapper.newInstance();
      volumeMapper.setInputData(imageData);
      const volume = vtkVolume.newInstance();
      volume.setMapper(volumeMapper);
      volume.getProperty().setRGBTransferFunction(0, colorFunction);
      volume.getProperty().setScalarOpacityUnitDistance(0, 2.0);
      renderer.addVolume(volume);

      // ------------ Barre scalaire
      const scalarBarActor = vtkScalarBarActor.newInstance();
      scalarBarActor.setScalarsToColors(colorFunction);
      scalarBarActor.setAxisLabel('G_values');
      scalarBarActor.setAxisTextStyle({ fontSize: 14, fontColor: 'black' });
      scalarBarActor.setTickTextStyle({fontColor : "black"})
      renderer.addActor(scalarBarActor);
    }
    

    // ------------ Grille 3D
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

    console.log(cubeSource)

    const cubeMapper = vtkMapper.newInstance();
    cubeMapper.setInputConnection(cubeSource.getOutputPort());

    const cubeActor = vtkActor.newInstance();
    cubeActor.setMapper(cubeMapper);
    cubeActor.getProperty().setRepresentation(1); // wireframe
    cubeActor.getProperty().setColor(0,0,0);
    renderer.addActor(cubeActor);

    // ---------------------------

    console.log("Bounds :", imageData.getBounds());
  }
  // --------------- Visualiser les points_surface ----------------
  if (scene.points_surface) {
    const surfacePoints = scene.points_surface.points;

    if (surfacePoints.length > 0) {
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

        // 2. Rayon proportionnel à la taille
      const sphereSource = vtkSphereSource.newInstance({
        radius: 5,
        thetaResolution: 16,
        phiResolution: 16,
      });

      const glyphMapper = vtkGlyph3DMapper.newInstance();
      glyphMapper.setInputData(polyData);
      glyphMapper.setSourceConnection(sphereSource.getOutputPort());

      const glyphActor = vtkActor.newInstance();
      glyphActor.setMapper(glyphMapper);
      glyphActor.getProperty().setColor(0, 0, 0);
      glyphActor.getProperty().setPointSize(15)
      glyphActor.getProperty().setOpacity(1.0);
      renderer.addActor(glyphActor);



        // --- Logs pour vérification
      console.log('Bounds grille:', renderer.computeVisiblePropBounds());
      console.log('Bounds polyData:', polyData.getBounds());
    }
  }

  // --------------- Visualiser les points_profondeurs ----------------
  if (scene.points_profondeurs) {
    const profPoints = scene.points_profondeurs.points;
    // const pointsValeurs = scene.points_profondeurs.data_points
    const pointsValeurs = [93.42, 88.68, 88.68, 89.68, 94.07, 93.42, 88.68, 89.68, 94.07, 92.17, 89.165, 89.165, 87.516, 87.516, 94.61, 94.61, 95.924, 95.924, 89.293, 89.293, 85.617, 85.617, 83.186, 83.186, 86.398,86.398, 99.957, 99.957, 98.413, 93.308, 82.394, 82.394, 83.971, 90.116, 90.116, 80.602, 80.602]
    // const pointsValeurs = [9147989.68, 9147994.07, 9147992.17, 9147989.165, 9147989.165, 9147987.516, 9147987.516, 9147994.61, 9147994.61, 9147995.924, 9147995.924, 9147989.293, 9147989.293, 9147985.617, 9147985.617, 9147983.186, 9147983.186, 9147986, 9147983.971, 9147990.116, 9147990.116, 9148004.118, 9147980.602, 9148009.472]
    if (profPoints.length > 0) {

      console.log("Exemple point 0:", profPoints[0]);
      console.log("Valeur associée:", pointsValeurs[0]);
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

      const scalars = vtkDataArray.newInstance({
        name: 'valeurs',
        numberOfComponents: 1,
        values: new Float32Array(pointsValeurs),
      });
      polyData.getPointData().setScalars(scalars);

      // --- Calcule min et max pour l'échelle de couleur
      const minVal = Math.min(...pointsValeurs);
      const maxVal = Math.max(...pointsValeurs);
      console.log("Value extrem",minVal, maxVal)

      // --- Crée une fonction de transfert couleur
      const colorFunction = vtkColorTransferFunction.newInstance();
      colorFunction.addRGBPoint(minVal, 0, 0, 1);   // bleu pour le minimum
      colorFunction.addRGBPoint(maxVal, 1, 0, 0);   // rouge pour le maximum

        // 2. Rayon proportionnel à la taille
      const sphereSource = vtkSphereSource.newInstance({
        radius: 5,
        thetaResolution: 16,
        phiResolution: 16,
      });

      const scalarBarActor = vtkScalarBarActor.newInstance();
      scalarBarActor.setScalarsToColors(colorFunction);
      scalarBarActor.setAxisLabel('P_values');
      scalarBarActor.setAxisTextStyle({ fontSize: 14, fontColor: 'black' });
      scalarBarActor.setTickTextStyle({fontColor : "black"})

      renderer.addActor(scalarBarActor);

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

        // --- Logs pour vérification
      console.log('Bounds grille:', renderer.computeVisiblePropBounds());
      console.log('Bounds polyData:', polyData.getBounds());
    }
  }
  renderer.resetCamera();
  // autoZoom(renderer)
  renderWindow.render();
  console.log('Nombre d’acteurs :', renderer.getActors().length);
});

function autoZoom(renderer, targetSize = 100) {
  const bounds = renderer.computeVisiblePropBounds();
  const xSize = bounds[1] - bounds[0];
  const ySize = bounds[3] - bounds[2];
  const zSize = bounds[5] - bounds[4];
  const maxSize = Math.max(xSize, ySize, zSize);

  if (maxSize > 0) {
    const factor = maxSize / targetSize;
    renderer.getActiveCamera().zoom(factor);
  }
}
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