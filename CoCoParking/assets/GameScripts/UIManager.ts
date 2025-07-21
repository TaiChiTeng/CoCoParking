import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {

    constructor() {
        super();
    }

    /** 打开设置界面（主菜单或关卡中） */
    public showSettingsUI(): void {}

    /** 关闭设置界面 */
    public hideSettingsUI(): void {}

    /** 显示主菜单界面 */
    public showMainMenu(): void {}

    /** 显示关卡界面 */
    public showGameUI(): void {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


