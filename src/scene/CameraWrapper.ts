import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import { constants } from "../constants"

export class CameraWrapper {
    public camera: THREE.PerspectiveCamera;
    private _controls: PointerLockControls;
    private _isMovingForward = false;
    private _isMovingLeft = false;
    private _isMovingRight = false;
    private _isMovingBack = false;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            constants.camera.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            constants.corridorParams.length,
        );

        this._controls = new PointerLockControls(this.camera, document.body);

        // Keys events
        const onKeyDown = (event: KeyboardEvent): void => {
            switch (event.code) {
                case 'KeyW':
                    this._isMovingForward = true;
                    break;
                case 'KeyA':
                    this._isMovingLeft = true;
                    break;
                case 'KeyD':
                    this._isMovingRight = true;
                    break;
                case 'KeyS':
                    this._isMovingBack = true;
                    break;
            }
        };
        const onKeyUp = (event: KeyboardEvent): void => {
            switch (event.code) {
                case 'KeyW':
                    this._isMovingForward = false;
                    break;
                case 'KeyA':
                    this._isMovingLeft = false;
                    break;
                case 'KeyD':
                    this._isMovingRight = false;
                    break;
                case 'KeyS':
                    this._isMovingBack = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);

        const blocker = document.getElementById('blocker')!;
        const instructions = document.getElementById('instructions')!;
        const inputFieldTopic = document.getElementById('input-field')! as HTMLInputElement;
        const inputFieldApi = document.getElementById('api-input')! as HTMLInputElement;

        // Lock/Unlock events
        this._controls.addEventListener('lock', function () {
            instructions.style.display = 'none';
            blocker.style.display = 'none';

            inputFieldTopic.readOnly = true;
            inputFieldApi.readOnly = true;
        });

        this._controls.addEventListener('unlock', function () {
            blocker.style.display = 'block';
            instructions.style.display = 'flex';

            inputFieldTopic.readOnly = false;
        });
    }

    lock(): void {
        this._controls.lock();
    }

    updateKeyboardMovement(): void {
        if (this._controls.isLocked) {
            this._moveWithKeyboard();
        }
    }

    private _moveWithKeyboard(): void {
        if (this._isMovingForward) {
            this._controls.moveForward(constants.camera.movementSpeed);
        }
        if (this._isMovingLeft) {
            this._controls.moveRight(-constants.camera.movementSpeed);
        }
        if (this._isMovingRight) {
            this._controls.moveRight(constants.camera.movementSpeed);
        }
        if (this._isMovingBack) {
            this._controls.moveForward(-constants.camera.movementSpeed);
        }
    }
}