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



//#-------------------------------------------------

import '@kitware/vtk.js/Rendering/Profiles/Geometry'
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
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

  const renderer = fullScreenRenderer.getRenderer()
  const renderWindow = fullScreenRenderer.getRenderWindow()

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
  
  // Quand la scène est prête que tout les acteurs ont été créé on l'affiche.
  sceneImporter.onReady(() => {
    renderer.resetCamera()
    renderWindow.render()
  })
})

//#-------------------------------------------------

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