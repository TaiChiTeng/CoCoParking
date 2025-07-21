import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    private currentLevel: number;

    constructor() {
        super();
    }

    /** 启动游戏，加载或创建存档 */
    public initializeGame(): void {}

    /** 加载指定关卡 */
    public loadLevel(levelId: number): void {}

    /** 尝试通关检测 */
    public checkClearCondition(): void {}

    /** 进入下一关并更新存档 */
    public loadNextLevel(): void {}

    /** 重置当前关卡 */
    public resetLevel(): void {}

    /** 保存当前关卡数到存档 */
    public saveProgress(levelId: number): void {}

    /** 返回主菜单流程 */
    public returnToMenu(): void {}

    /** 在关卡流程中打开设置 */
    public openSettings(): void {}

    /** 关闭设置界面，恢复关卡状态 */
    public closeSettings(): void {}

    start() {

    }

    update(deltaTime: number) {
        
    }
}


