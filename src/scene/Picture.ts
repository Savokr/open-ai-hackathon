import * as THREE from 'three';
import { ImagesResponseDataInner } from "openai";

import { image1 } from '../openai/testImages';
import { constants } from '../constants';

export enum PictureSide {
    Left = -1,
    Right = 1
}

export class Picture {
    private _textInfo: CanvasText;
    private _imgObject: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>

    private _textureLoader: THREE.TextureLoader;

    constructor(scene: THREE.Scene, position: THREE.Vector3, zPosition: number, side: PictureSide) {
        this._textureLoader = new THREE.TextureLoader();

        const material = new THREE.MeshStandardMaterial();
        const geometry = new THREE.PlaneGeometry(constants.corridorParams.pictures.size, constants.corridorParams.pictures.size);
        this._imgObject = new THREE.Mesh(geometry, material);
        this._imgObject.castShadow = true;

        const xPosition = position.x + side * (constants.corridorParams.width / 2 - 0.1);
        this._imgObject.position.set(
            xPosition,
            position.y,
            zPosition,
        );
        this._imgObject.rotateY((side * -Math.PI) / 2);

        scene.add(this._imgObject);

        this._textInfo = new CanvasText(
            scene,
            position,
            xPosition,
            zPosition,
            "",
            side
        );
    }

    async updatePicture(imageData: Promise<ImagesResponseDataInner>, text: string): Promise<void> {
        this._textInfo.updateText(text);

        const img = await imageData;
        const imgString = (img.b64_json ? ('data:image/png;base64,' + img.b64_json) : img.url) ?? '';
        const map = this._textureLoader.load(imgString);
        this._imgObject.material.map = map;
        this._imgObject.material.needsUpdate = true;
    }
}

class CanvasText {
    private _canvas: HTMLCanvasElement;
    private _object: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

    constructor(scene: THREE.Scene, position: THREE.Vector3, xPosition: number, zPosition: number, text: string, side: PictureSide) {
        this._canvas = document.createElement('canvas');
        const textureSize = 1024;
        this._canvas.width = textureSize;
        this._canvas.height = textureSize / 4;
        const context = this._canvas.getContext('2d')!;

        context.font = '48px Courier New';
        context.fillStyle = new THREE.Color('White').getStyle();
        context.fillText(text, 0, 50);

        const map = new THREE.CanvasTexture(this._canvas);
        const material = new THREE.MeshBasicMaterial({
            map: map,
            transparent: true,
        });
        const geometry = new THREE.PlaneGeometry(constants.corridorParams.pictures.size, constants.corridorParams.pictures.size / 4);
        this._object = new THREE.Mesh(geometry, material);

        this._object.position.set(
            xPosition,
            position.y - (constants.corridorParams.pictures.size / 2 + constants.corridorParams.texts.offset),
            zPosition,
        );
        this._object.rotateY((side * -Math.PI) / 2);

        scene.add(this._object);
    }

    updateText(newText: string): void {
        const canvasText1 = newText.slice(0, constants.corridorParams.texts.newLineLength);
        const canvasText2 = newText.slice(constants.corridorParams.texts.newLineLength, constants.corridorParams.texts.newLineLength*2);
        const canvasText3 = newText.slice(constants.corridorParams.texts.newLineLength*2);

        const context = this._canvas.getContext('2d')!;

        context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        context.fillText(canvasText1, 0, 50);
        context.fillText(canvasText2, 0, 100);
        context.fillText(canvasText3, 0, 150);

        const textureMap = new THREE.CanvasTexture(this._canvas);
        this._object.material.map = textureMap;
        this._object.material.needsUpdate = true;
    }
}