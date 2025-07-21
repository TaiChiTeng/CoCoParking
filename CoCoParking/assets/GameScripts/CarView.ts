import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CarView')
export class CarView extends Component {

    private carId: number;

    constructor(carId: number) {
        super();
    }

    /** 播放移动动画（1秒内完成） */
    public playMoveAnimation(startX: number, startY: number, endX: number, endY: number): void {}

    /** 设置初始贴图 */
    public setCarTexture(textureName: string): void {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


