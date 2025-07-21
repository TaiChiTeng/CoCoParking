import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SettingsManager')
export class SettingsManager extends Component {

    private static soundEnabled: boolean = true;

    /** 初始化设置（从存档加载） */
    public static initialize(): void {}

    /** 设置是否开启音效 */
    public static setSoundEnabled(enabled: boolean): void {}

    /** 获取当前音效状态 */
    public static isSoundEnabled(): boolean {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


