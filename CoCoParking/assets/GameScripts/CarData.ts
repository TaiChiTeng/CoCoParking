import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum CarDirection {
    Down,
    Left,
    Right,
}

export interface CarData {
    id: number;
    direction: CarDirection;
    sortIndex: number;
    size: number; // 1, 2 或 3
    carW: number;
    carH: number;
    startX: number;
    startY: number;
}

@ccclass('CarData')
export class CarData extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
}


