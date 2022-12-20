import * as THREE from 'three';
import { ImagesResponseDataInner } from "openai";

import { image1 } from '../openai/testImages';
import { constants } from '../constants';
import { Object3D } from 'three';

export class TitledPicture extends Object3D {
    private _textObject: CanvasText;
    private _imgObject: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>

    private _textureLoader: THREE.TextureLoader;
    private _pictureMaterial: THREE.MeshStandardMaterial;

    constructor(textureLoader: THREE.TextureLoader, pictureMaterial?: THREE.MeshStandardMaterial, textMaterial?: THREE.MeshBasicMaterial) {
        super();
        this._textureLoader = textureLoader;
        this._pictureMaterial = pictureMaterial ?? new THREE.MeshStandardMaterial();

        const geometry = new THREE.PlaneGeometry(constants.corridorParams.pictures.size, constants.corridorParams.pictures.size);
        this._imgObject = new THREE.Mesh(geometry, this._pictureMaterial);

        this.add(this._imgObject);

        this._textObject = new CanvasText('Loading...', textMaterial);
        this._textObject.position.y = - (geometry.parameters.height / 2 + constants.corridorParams.texts.offset);

        this.add(this._textObject);
    }

    async updatePicture(imageData: Promise<ImagesResponseDataInner>, text: string): Promise<void> {
        this._textObject.updateText(text);

        const img = await imageData;
        const imgString = (img.b64_json ? ('data:image/png;base64,' + img.b64_json) : img.url) ?? '';
        const map = this._textureLoader.load(imgString);
        this._imgObject.material.map?.dispose();
        this._imgObject.material.map = map;
        this._imgObject.material.needsUpdate = true;
    }
}

class CanvasText extends THREE.Object3D {
    private _canvas: HTMLCanvasElement;
    private _object: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

    constructor(text: string, material?: THREE.MeshBasicMaterial) {
        super();
        this._canvas = document.createElement('canvas');
        const textureSize = 1024;
        this._canvas.width = textureSize;
        this._canvas.height = textureSize / 4;
        const context = this._canvas.getContext('2d')!;

        context.font = '48px Courier New';
        context.fillStyle = new THREE.Color('White').getStyle();
        context.fillText(text, 0, 50);

        const map = new THREE.CanvasTexture(this._canvas);
        const _material = material ?? new THREE.MeshBasicMaterial({
            transparent: true,
        });
        _material.map = map;
        const geometry = new THREE.PlaneGeometry(constants.corridorParams.pictures.size, constants.corridorParams.pictures.size / 4);
        this._object = new THREE.Mesh(geometry, _material);

        this.add(this._object);
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

        this._object.material.map?.dispose();

        const textureMap = new THREE.CanvasTexture(this._canvas);
        this._object.material.map = textureMap;
        this._object.material.needsUpdate = true;
    }
}