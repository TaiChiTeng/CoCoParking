import { _decorator, Component, Node } from 'cc';
import { CarData } from "./CarData";
const { ccclass, property } = _decorator;

export interface LevelData {
    mapW: number;
    mapH: number;
    map: number[][];
    cars: CarData[];
}

export const Levels: LevelData[] = [
    {
        mapW: 5,
        mapH: 6,
        map: [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
        ],
        cars: [
            { id: 1, direction: 0, sortIndex: 0, size: 3, carW: 1, carH: 3, startX: 0, startY: -3 },
            { id: 2, direction: 0, sortIndex: 1, size: 2, carW: 1, carH: 2, startX: 1, startY: -2 },
            { id: 3, direction: 0, sortIndex: 2, size: 1, carW: 1, carH: 1, startX: 2, startY: -1 },
        ]
    },
    // ... 其它关卡
];

@ccclass('LevelData')
export class LevelData extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
}


