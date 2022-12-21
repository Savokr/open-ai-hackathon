import * as THREE from 'three';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

import { WrappedOpenAiApi } from "../openai/WrappedOpenAiApi";
import { TitledPicture } from './TitledPicture';

import { constants } from "../constants";

export enum PictureSide {
    Left = -1,
    Right = 1
}

export class CorridorInstance extends THREE.Object3D {
    public topic = "";

    private _lowerPlane: THREE.Mesh;
    private _upperPlane: THREE.Mesh;
    private _leftPlane: THREE.Mesh;
    private _rightPlane: THREE.Mesh;

    private _corridorBB: THREE.Box3;
    private _lights: THREE.Object3D[] = [];
    private _pictures: TitledPicture[] = [];

    constructor(textureLoader: THREE.TextureLoader) {
        super();

        const corridorMaterial = new THREE.MeshStandardMaterial({
            color: constants.corridorParams.color,
            side: THREE.DoubleSide,
        });

        const lowerUpperPlaneGeometry = new THREE.PlaneGeometry(
            constants.corridorParams.width,
            constants.corridorParams.length
        );
        this._lowerPlane = new THREE.Mesh(lowerUpperPlaneGeometry, corridorMaterial);
        this._upperPlane = new THREE.Mesh(lowerUpperPlaneGeometry, corridorMaterial);
        this._lowerPlane.rotateX(Math.PI/2);
        this._upperPlane.rotateX(Math.PI/2);
        this._lowerPlane.position.y -= constants.corridorParams.height / 2;
        this._upperPlane.position.y += constants.corridorParams.height / 2;
        this._lowerPlane.receiveShadow = true;
        this._upperPlane.receiveShadow = true;
        this.add(this._lowerPlane);
        this.add(this._upperPlane);

        const leftRightPlaneGeometry = new THREE.PlaneGeometry(
            constants.corridorParams.height,
            constants.corridorParams.length
        );
        this._leftPlane = new THREE.Mesh(leftRightPlaneGeometry, corridorMaterial);
        this._rightPlane = new THREE.Mesh(leftRightPlaneGeometry, corridorMaterial);
        this._leftPlane.rotateX(Math.PI/2);
        this._leftPlane.rotateY(Math.PI/2);
        this._rightPlane.rotateX(Math.PI/2);
        this._rightPlane.rotateY(Math.PI/2);
        this._leftPlane.position.x -= constants.corridorParams.width / 2;
        this._rightPlane.position.x += constants.corridorParams.width / 2;
        this._leftPlane.receiveShadow = true;
        this._rightPlane.receiveShadow = true;
        this.add(this._leftPlane);
        this.add(this._rightPlane);

        this._corridorBB = new THREE.Box3().setFromObject(this);

        const intervalBetweenLights = constants.corridorParams.length / (constants.corridorParams.lights.count + 1);
        for (let i = 1; i <= constants.corridorParams.lights.count; i++) {
            const areaLight = new THREE.RectAreaLight(undefined, 40, 0.5, 0.5);
            const areaLightHelper = new RectAreaLightHelper(areaLight);
            areaLight.add(areaLightHelper);

            const zPosition = i * intervalBetweenLights + this._corridorBB.min.z;
            areaLight.position.y = constants.corridorParams.height / 2 - 0.01;
            areaLight.position.z = zPosition;
            areaLight.rotateX(-Math.PI / 2);
            this.add(areaLight);
            this._lights.push(areaLight);

            const picture1 = new TitledPicture(textureLoader);
            const picture2 = new TitledPicture(textureLoader);

            this.applyPictureTransform(PictureSide.Left, picture1, zPosition);
            this.applyPictureTransform(PictureSide.Right, picture2, zPosition);

            this.add(picture1);
            this.add(picture2);

            this._pictures.push(picture1);
            this._pictures.push(picture2);
        }
    }

    async updateTopic(api: WrappedOpenAiApi, newTopic: string, isForceUpdate: boolean): Promise<void> {
        if (newTopic === this.topic && !isForceUpdate) {
            return;
        }

        this.topic = newTopic;

        const images = await api.getImagesFromTopic(`Generate a phrase describing surroundings with ${newTopic}`, this._pictures.length);

        for(let i = 0; i < this._pictures.length; ++i) {
            await this._pictures[i].updatePicture(images[i].imageData, images[i].text);
        }
    }

    private applyPictureTransform(side: PictureSide, object: THREE.Object3D, zPosition: number): void {

        const xPosition = side * (constants.corridorParams.width / 2 - 0.1);
        object.position.set(
            xPosition,
            0,
            zPosition,
        );
        object.rotateY((side * -Math.PI) / 2);
    }
}