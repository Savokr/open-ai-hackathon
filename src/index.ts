import { SceneManager } from "./scene/SceneManager";

const sceneManager = new SceneManager();

const render = (): void => {
    sceneManager.render();
    requestAnimationFrame(render);
};

render();