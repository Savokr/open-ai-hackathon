import * as THREE from 'three';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

import { WrappedOpenAiApi } from "../openai/WrappedOpenAiApi";
import { Picture, PictureSide } from './Picture';

import { constants } from "../constants";

export class CorridorInstance {
    public topic = "";
    public position: THREE.Vector3;

    private _corridor: THREE.Mesh;
    private _corridorBB: THREE.Box3;
    private _lights: THREE.Object3D[] = [];
    private _pictures: Picture[] = [];

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.position = position;

        const corridorGeometry = new THREE.BoxGeometry(
            constants.corridorParams.width,
            constants.corridorParams.height,
            constants.corridorParams.length,
        );
        const corridorMaterial = new THREE.MeshStandardMaterial({
            color: constants.corridorParams.color,
            side: THREE.DoubleSide,
        });
        this._corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
        this._corridor.receiveShadow = true;
        this._corridor.position.copy(position);
        scene.add(this._corridor);

        this._corridorBB = new THREE.Box3().setFromObject(this._corridor);

        const intervalBetweenLights = constants.corridorParams.length / (constants.corridorParams.lights.count + 1);
        for (let i = 1; i <= constants.corridorParams.lights.count; i++) {
            const areaLight = this.createAreaLight(scene);
            const areaLightHelper = new RectAreaLightHelper(areaLight);
            scene.add(areaLightHelper);

            const zPosition = i * intervalBetweenLights + this._corridorBB.min.z;
            areaLight.position.set(
                position.x,
                position.y + constants.corridorParams.height / 2 - 0.01,
                zPosition,
            );
            areaLight.rotateX(-Math.PI / 2);
            this._lights.push(areaLight);

            this._pictures.push(new Picture(scene, position, zPosition, PictureSide.Left));
            this._pictures.push(new Picture(scene, position, zPosition, PictureSide.Right));
        }
    }

    async updateTopic(api: WrappedOpenAiApi, newTopic: string): Promise<void> {
        if (newTopic === this.topic) {
            return;
        }

        this.topic = newTopic;

        const images = await api.getImagesFromTopic(`Generate a phrase describing surroundings with ${newTopic}`, this._pictures.length);

        for(let i = 0; i < this._pictures.length; ++i) {
            await this._pictures[i].updatePicture(images[i].imageData, images[i].text);
        }
    }

    private createAreaLight(scene: THREE.Scene): THREE.RectAreaLight {
        const areaLight = new THREE.RectAreaLight(undefined, 40, 0.5, 0.5);
        scene.add(areaLight);
        return areaLight;
    }
}