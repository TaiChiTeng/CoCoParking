import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {
    public mapData: number[][];
    public mapW: number;
    public mapH: number;

    constructor(mapW: number, mapH: number, data: number[][]) {}

    /** 判断该位置是否可停 */
    public canParkAt(x: number, y: number): boolean {}

    /** 判断该位置是否有阻挡 */
    public isBlocked(x: number, y: number): boolean {}

    /** 标记一个格子已停放车辆 */
    public setParked(x: number, y: number): void {}

    /** 标记一个格子为未停状态 */
    public clearParked(x: number, y: number): void {}

    /** 是否所有车都进入停车场 */
    public isLevelCleared(): boolean {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


