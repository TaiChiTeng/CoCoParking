import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SaveManager')
export class SaveManager extends Component {

    private static saveKey = "CocoPark_Save";

    private static soundKey = "CocoPark_SoundEnabled";

    /** 存储音效是否开启 */
    public static saveSoundEnabled(enabled: boolean): void {}

    /** 读取音效设置，默认 true */
    public static loadSoundEnabled(): boolean {}

    /** 获取当前存档关卡号，如果不存在返回 null */
    public static loadCurrentLevel(): number | null {}

    /** 保存当前关卡号 */
    public static saveCurrentLevel(level: number): void {}

    /** 创建初始存档（level=1） */
    public static createDefaultSave(): void {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


