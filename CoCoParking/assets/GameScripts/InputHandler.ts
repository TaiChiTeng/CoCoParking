import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InputHandler')
export class InputHandler extends Component {
    
    constructor() {
        super();
    }

    /** 注册点击事件 */
    public setupListeners(): void {}

    /** 点击汽车后触发逻辑 */
    private onCarClicked(carId: number): void {}
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


