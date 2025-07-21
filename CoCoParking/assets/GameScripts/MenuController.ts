import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MenuController')
export class MenuController extends Component {

    constructor() {
        super();
    }

    /** 显示菜单UI并等待玩家点击“开始游戏” */
    public showMainMenu(): void {}

    /** 玩家点击开始后，进入当前关卡 */
    public onStartGame(): void {}

    /** 点击“设置”按钮时打开设置界面 */
    public onSettingsClicked(): void {}

    /** 玩家从设置界面返回菜单 */
    public onCloseSettings(): void {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


