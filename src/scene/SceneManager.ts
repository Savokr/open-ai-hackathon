import * as THREE from 'three';

import { WrappedOpenAiApi } from "../openai/WrappedOpenAiApi";
import { CameraWrapper } from "./CameraWrapper";
import { CorridorInstance } from "./CorridorInstance";

import { constants } from '../constants';

import { styleFullScreen } from "../helpers";

//@ts-ignore
import { config } from 'config';

export class SceneManager {
    private _api: WrappedOpenAiApi;
    private _renderer: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _cameraWrapper: CameraWrapper;
    private _textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

    private _corridorMap = new Map<string, CorridorInstance>;

    private _topic = "";

    constructor() {
        this._api = new WrappedOpenAiApi();
        this._cameraWrapper = new CameraWrapper();

        if (config?.openAiApi ?? false) {
            this._api.setApiKey(config.openAiApi);
        }

        // Make scene
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color('black');

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(undefined, 0.3);
        this._scene.add(ambientLight);

        // Make renderer
        const canvasWrapper = document.getElementById('canvas-wrapper')!;
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        const domElement = this._renderer.domElement;
        canvasWrapper.appendChild(domElement);
        styleFullScreen(canvasWrapper);
        styleFullScreen(domElement);
        this._renderer.setSize(window.innerWidth, window.innerHeight);

        const initialCorridor = new CorridorInstance(this._textureLoader);
        this._scene.add(initialCorridor);
        this._addToMapCorridor(initialCorridor);

        const zLowerCorridor = new CorridorInstance(this._textureLoader);
        zLowerCorridor.position.z = -constants.corridorParams.length;
        this._scene.add(zLowerCorridor);
        this._addToMapCorridor(zLowerCorridor);

        const zUpperCorridor = new CorridorInstance(this._textureLoader);
        zUpperCorridor.position.z = constants.corridorParams.length;
        this._scene.add(zUpperCorridor);
        this._addToMapCorridor(zUpperCorridor);

        const resizeListener = (): void => {
            this._cameraWrapper.camera.aspect = window.innerWidth / window.innerHeight;
            this._cameraWrapper.camera.updateProjectionMatrix();
            this._renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', resizeListener);

        const inputFieldTopic = document.getElementById('input-field')! as HTMLInputElement;
        const inputFieldApi = document.getElementById('api-input')! as HTMLInputElement;
        const clickListener = (event: KeyboardEvent): void => {
            if (event.code != "Enter") {
                return;
            }

            if (!(inputFieldApi.value === '' || inputFieldApi.value === 'your key')) {
                this._api.setApiKey(inputFieldApi.value);
            }

            this._topic = inputFieldTopic.value;

            this._cameraWrapper.lock();
        }
        document.addEventListener('keydown', clickListener);
    }

    async render(): Promise<void> {
        this._preRenderActions();

        this._renderer.render(this._scene, this._cameraWrapper.camera);
    }

    /* Private functions */

    private async _preRenderActions(): Promise<void> {
        this._cameraWrapper.updateKeyboardMovement();

        this._moveCorridors();
        this._updateCorridors();
    }

    private _moveCorridors(): void {
        const {
            zLowerCorridorPosition,
            zLowerCorridor,
            zUpperCorridorPosition,
            zUpperCorridor,
        } = this._getCorridorInfo();

        if (!zLowerCorridor && !zUpperCorridor) {
            throw new Error("Not expected; two undefined corridors");
        }

        if (!zLowerCorridor) {
            const corridorToMovePosition = zUpperCorridorPosition;
            corridorToMovePosition.z += constants.corridorParams.length;

            const corridorToMove = this._getFromMapCorridor(corridorToMovePosition);
            if (!corridorToMove) {
                throw new Error("Couldn't find corridor to move (to lower)");
            }
            this._deleteFromMapCorridor(corridorToMove);
            corridorToMove.position.z = zLowerCorridorPosition.z;
            corridorToMove.updateTopic(this._api, this._topic, true);
            this._addToMapCorridor(corridorToMove);
        }

        if (!zUpperCorridor) {
            const corridorToMovePosition = zLowerCorridorPosition;
            corridorToMovePosition.z -= constants.corridorParams.length;

            const corridorToMove = this._getFromMapCorridor(corridorToMovePosition);
            if (!corridorToMove) {
                throw new Error("Couldn't find corridor to move (to lower)");
            }
            this._deleteFromMapCorridor(corridorToMove);
            corridorToMove.position.z = zUpperCorridorPosition.z;
            corridorToMove.updateTopic(this._api, this._topic, true);
            this._addToMapCorridor(corridorToMove);
        }
    }

    private async _updateCorridors(): Promise<void> {
        const {
            zLowerCorridor,
            currentCorridor,
            zUpperCorridor,
        } = this._getCorridorInfo();

        if (zLowerCorridor && zLowerCorridor.topic != this._topic) {
            await zLowerCorridor.updateTopic(this._api, this._topic, false);
        }

        if (currentCorridor && currentCorridor.topic != this._topic) {
            await currentCorridor.updateTopic(this._api, this._topic, false);
        }

        if (zUpperCorridor && zUpperCorridor.topic != this._topic) {
            await zUpperCorridor.updateTopic(this._api, this._topic, false);
        }
    }

    private _getCorridorInfo(): {
        currentCorridorPosition: THREE.Vector3,
        currentCorridor?: CorridorInstance,
        zLowerCorridorPosition: THREE.Vector3,
        zLowerCorridor?: CorridorInstance,
        zUpperCorridorPosition: THREE.Vector3,
        zUpperCorridor?: CorridorInstance,
    } {
        const length = constants.corridorParams.length;
        const halfLength = constants.corridorParams.length / 2;

        const currentPosition = this._cameraWrapper.camera.position;

        const currentCorridorPosition = new THREE.Vector3().copy(currentPosition);
        currentCorridorPosition.x = 0;
        currentCorridorPosition.y = 0;
        const zModulus = currentPosition.z >= 0 ?
            currentPosition.z % halfLength :
            (halfLength + currentPosition.z % halfLength) % halfLength;
        currentCorridorPosition.z = length * Math.floor((currentCorridorPosition.z - zModulus + halfLength) / length);

        const zLowerCorridorPosition = new THREE.Vector3().copy(currentCorridorPosition);
        zLowerCorridorPosition.z -= length;

        const zUpperCorridorPosition = new THREE.Vector3().copy(currentCorridorPosition);
        zUpperCorridorPosition.z += length;

        return {
            currentCorridorPosition,
            currentCorridor: this._getFromMapCorridor(currentCorridorPosition),
            zLowerCorridorPosition,
            zLowerCorridor: this._getFromMapCorridor(zLowerCorridorPosition),
            zUpperCorridorPosition,
            zUpperCorridor: this._getFromMapCorridor(zUpperCorridorPosition),
        }
    }

    private _addToMapCorridor(newCorridor: CorridorInstance): void {
        this._corridorMap.set(newCorridor.position.toArray().toString(), newCorridor);
    }

    private _deleteFromMapCorridor(corridor: CorridorInstance): void {
        this._corridorMap.delete(corridor.position.toArray.toString());
    }

    private _getFromMapCorridor(position: THREE.Vector3): CorridorInstance | undefined {
        return this._corridorMap.get(position.toArray().toString());
    }
}