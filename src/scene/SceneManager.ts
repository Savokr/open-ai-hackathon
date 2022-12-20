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

    private readonly _initialPosition = new THREE.Vector3(0, 0, 0);
    private _corridorMap = new Map<string, CorridorInstance>;

    private _topic = "";

    constructor() {
        this._api = new WrappedOpenAiApi();
        this._cameraWrapper = new CameraWrapper();

        if (config?.openAiApi) {
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

        this._addCorridor(new CorridorInstance(this._scene, this._initialPosition));

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

        this._generateCorridors();
        this._updateCorridors();
    }

    private _generateCorridors(): void {
        const {
            zLowerCorridor,
            zLowerCorridorPosition,
            zUpperCorridor,
            zUpperCorridorPosition
        } = this._getZLowerAndUpperCorridors();

        if (!zLowerCorridor) {
            console.log('new corridor');
            this._addCorridor(new CorridorInstance(this._scene, zLowerCorridorPosition));
        }

        if (!zUpperCorridor) {
            this._addCorridor(new CorridorInstance(this._scene, zUpperCorridorPosition));
        }
    }

    private async _updateCorridors(): Promise<void> {
        const {
            zLowerCorridor,
            zUpperCorridor,
        } = this._getZLowerAndUpperCorridors();

        if (zLowerCorridor && zLowerCorridor.topic != this._topic) {
            await zLowerCorridor.updateTopic(this._api, this._topic);
        }

        if (zUpperCorridor && zUpperCorridor.topic != this._topic) {
            await zUpperCorridor.updateTopic(this._api, this._topic);
        }
    }

    private _getZLowerAndUpperCorridors(): {
        zLowerCorridor: CorridorInstance | undefined,
        zLowerCorridorPosition: THREE.Vector3,
        zUpperCorridor: CorridorInstance | undefined,
        zUpperCorridorPosition: THREE.Vector3,
    } {
        const currentPosition = this._cameraWrapper.camera.position;

        const zCurrentPositionWithShift = currentPosition.z - this._initialPosition.z
        const length = constants.corridorParams.length;
        const zModulus = zCurrentPositionWithShift >= 0 ?
            zCurrentPositionWithShift % length :
            (length + zCurrentPositionWithShift % length) % length;
        const zLowerCorridorZCoordinate = zCurrentPositionWithShift - zModulus + this._initialPosition.z;
        const zUpperCorridorZCoordinate = zCurrentPositionWithShift + length - zModulus + this._initialPosition.z;

        const zLowerCorridorPosition = new THREE.Vector3(this._initialPosition.x, this._initialPosition.y, zLowerCorridorZCoordinate);
        const zUpperCorridorPosition = new THREE.Vector3(this._initialPosition.x, this._initialPosition.y, zUpperCorridorZCoordinate);

        const zLowerCorridor = this._getCorridor(zLowerCorridorPosition);
        const zUpperCorridor = this._getCorridor(zUpperCorridorPosition);

        return {
            zLowerCorridor,
            zLowerCorridorPosition,
            zUpperCorridor,
            zUpperCorridorPosition
        }
    }

    private _addCorridor(newCorridor: CorridorInstance): void {
        this._corridorMap.set(newCorridor.position.toArray().toString(), newCorridor);
    }

    private _getCorridor(position: THREE.Vector3): CorridorInstance | undefined {
        return this._corridorMap.get(position.toArray().toString());
    }
}