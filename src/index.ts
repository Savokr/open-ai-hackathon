import { WholeScene } from "./scene/WholeScene";

const wholeScene = new WholeScene();

const render = (): void => {
    wholeScene.render();
    requestAnimationFrame(render);
};

render();