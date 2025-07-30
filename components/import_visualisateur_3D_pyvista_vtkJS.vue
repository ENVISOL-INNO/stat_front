<script setup>
// import { onMounted, ref } from 'vue'
// import '@kitware/vtk.js/Rendering/Profiles/Geometry'
// import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow'
// import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer'
// import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow'
// import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor'
// import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera'
// import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader'

// import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor'
// import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget'

// const container = ref(null)

// onMounted(() => {
//   const renderWindow = vtkRenderWindow.newInstance()
//   const renderer = vtkRenderer.newInstance()
//   renderWindow.addRenderer(renderer)

//   // WebGL rendering window
//   const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance()
//   openGLRenderWindow.setContainer(container.value)
//   renderWindow.addView(openGLRenderWindow)

//   console.log('Container value:', container.value)
//   const interactor = vtkRenderWindowInteractor.newInstance()
//   interactor.setView(openGLRenderWindow)
//   interactor.initialize()
//   interactor.bindEvents(container.value)

//   const interactorStyle = vtkInteractorStyleTrackballCamera.newInstance()
//   interactor.setInteractorStyle(interactorStyle)

//   // Création d'un axe
//   const axes = vtkAxesActor.newInstance()
//   const orientationWidget = vtkOrientationMarkerWidget.newInstance({
//     actor: axes,
//     interactor,
//   })
//   orientationWidget.setEnabled(true)
//   orientationWidget.setViewportCorner(
//     vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
//   )
//   orientationWidget.setViewportSize(0.15)
//   orientationWidget.setMinPixelSize(100)
//   orientationWidget.setMaxPixelSize(300)

//   const sceneLoader = vtkHttpSceneLoader.newInstance({
//     renderer,
//     fetchGzip: false,
//   })

//   const sceneDescription = sceneLoader.getScene()
//   console.log("DESCRIPTION", sceneDescription)

//   sceneLoader.setUrl('/scene_changedOrder/index.json')

//   sceneLoader.onReady(() => {
//     const actors = renderer.getActors()
//     console.log(renderer)

//     for (const actor of actors) {
//       const mapper = actor.getMapper()
//       const dataset = mapper?.getInputData()
//       if (dataset) {
//         console.log('type :', dataset.getClassName())
//       }
//     }

//     renderer.resetCamera()
//     renderWindow.render()
//   })
// })



//#------------------FONCTIONNEL MAIS VOLUME N'APPARAIT PAS-------------------------------

// import '@kitware/vtk.js/Rendering/Profiles/Geometry'
// import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
// import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
// import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
// import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
// const vtkContainer = ref(null)



// onMounted(() => {
//   const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
//     rootContainer: vtkContainer.value,
//     containerStyle: {
//       width: '100%',
//       height: '100%',
//       position: 'relative',
//     },
//   })

//   const renderer = fullScreenRenderer.getRenderer()
//   const renderWindow = fullScreenRenderer.getRenderWindow()

//   // Ajout de l'axe
//   const axes = vtkAxesActor.newInstance()
//   const orientationWidget = vtkOrientationMarkerWidget.newInstance({
//     actor: axes,
//     interactor: renderWindow.getInteractor(),
//   })
//   orientationWidget.setEnabled(true)
//   orientationWidget.setViewportCorner(
//     vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
//   )
//   orientationWidget.setViewportSize(0.15) // taille relative
//   orientationWidget.setMinPixelSize(50)
//   orientationWidget.setMaxPixelSize(100)

//   // Nouvelle scène (celle qui contient toutes nos données)
//   const sceneImporter = vtkHttpSceneLoader.newInstance({
//     fetchGzip: false,
//     renderer,
//   })

//   sceneImporter.setUrl('/scene.vtkjs', { loadData: true })

//   // Quand la scène est prête que tout les acteurs ont été créé on l'affiche.
//   sceneImporter.onReady(() => {
//     renderer.resetCamera()
//     renderWindow.render()
//   })
// })

//#------------------Création d'un Volume pour représenter la grille-------------------------------

import '@kitware/vtk.js/Rendering/Profiles/Geometry'
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import { ref, onMounted } from 'vue';
const vtkContainer = ref(null)



onMounted(() => {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    rootContainer: vtkContainer.value,
    containerStyle: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
  })

  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  // Ajout de l'axe
  const axes = vtkAxesActor.newInstance()
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: renderWindow.getInteractor(),
  })
  orientationWidget.setEnabled(true)
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  )
  orientationWidget.setViewportSize(0.15) // taille relative
  orientationWidget.setMinPixelSize(50)
  orientationWidget.setMaxPixelSize(100)

  // Nouvelle scène (celle qui contient toutes nos données)
  const sceneImporter = vtkHttpSceneLoader.newInstance({
    fetchGzip: false,
    renderer,
  })
  sceneImporter.setUrl('/scene.vtkjs', { loadData: true })

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: false });
  reader.setUrl('/scene.vtkjs/1', {loadData: true}).then(() => {
      const data = reader.getOutputData();

      const mapper = vtkVolumeMapper.newInstance();
      mapper.setSampleDistance(1);
      mapper.setInputData(data)

      const opacityFunction = vtkPiecewiseFunction.newInstance()
      opacityFunction.addPoint(0, 0);
      opacityFunction.addPoint(1, 1)

      const colorFunction = vtkColorTransferFunction.newInstance()
      colorFunction.addRGBPoint(0, 1, 0, 0);
      colorFunction.addRGBPoint(1, 0, 0, 1);

      const volume = vtkVolume.newInstance()
      volume.setMapper(mapper)
      volume.getProperty().setRGBTransferFunction(0, colorFunction);
      volume.getProperty().setScalarOpacity(0, opacityFunction);
      volume.getProperty().setScalarOpacityUnitDistance(0, 2.);
      renderer.addVolume(volume);
      renderer.resetCamera();
      renderWindow.render();
  })
  // Quand la scène est prête que tout les acteurs ont été créé on l'affiche.
  sceneImporter.onReady(() => {
    renderer.resetCamera()
    renderWindow.render()
  })
})

</script>

<template>
  <div ref="vtkContainer" style="width: 100%; height: 100vh; background: black"></div>
</template>

<style scoped>
.vtk-container {
  width: 100%;
  height: 100vh;
  background: black;
}
</style>