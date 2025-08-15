import { _decorator, Component, Node } from 'cc';
import { UIManager } from './UIManager';
import { CarManager } from './CarManager';
import { MapManager } from './MapManager';
import { CarAudio } from './CarAudio';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Node)
    public uiManagerNode: Node = null; // UIManager所在节点

    @property(Node)
    public carManagerNode: Node = null; // CarManager所在节点

    @property(Node)
    public mapManagerNode: Node = null; // MapManager所在节点

    @property(Node)
    public audioManagerNode: Node = null; // AudioManager所在节点

    private uiManager: UIManager = null;
    private carManager: CarManager = null;
    private mapManager: MapManager = null;
    private currentLevel: number = 1; // 当前关卡

    start() {
        // 获取各管理器引用
        this.initManagers();

        // 初始化时只显示主菜单
        this.uiManager?.showMainMenuOnly();
    }

    // 初始化各管理器引用
    private initManagers() {
        if (this.uiManagerNode) {
            this.uiManager = this.uiManagerNode.getComponent(UIManager);
            if (!this.uiManager) {
                console.error('Cannot find UIManager component on uiManagerNode');
            }
        } else {
            console.error('uiManagerNode is not assigned in GameManager');
        }

        if (this.carManagerNode) {
            this.carManager = this.carManagerNode.getComponent(CarManager);
            if (!this.carManager) {
                console.error('Cannot find CarManager component on carManagerNode');
            }
        } else {
            console.error('carManagerNode is not assigned in GameManager');
        }

        if (this.mapManagerNode) {
            this.mapManager = this.mapManagerNode.getComponent(MapManager);
            if (!this.mapManager) {
                console.error('Cannot find MapManager component on mapManagerNode');
            }
        } else {
            console.error('mapManagerNode is not assigned in GameManager');
        }

        // 设置CarManager的UIManager引用
        if (this.carManager && this.uiManager) {
            this.carManager.uiManager = this.uiManager;
            console.log('CarManager的UIManager引用已设置');
        } else {
            console.error('无法设置CarManager的UIManager引用：carManager或uiManager为null');
        }
    }

    // 设置当前关卡
    public setCurrentLevel(level: number): void {
        if (level >= 1 && level <= this.mapManager?.getTotalLevels()) {
            this.currentLevel = level;
            console.log(`Current level set to: ${level}`);

            // 更新关卡文本
            this.uiManager?.updateLevelLabel(level, this.mapManager?.getTotalLevels() || 0);

            // 当关卡改变时，重新创建地图
            this.mapManager?.setCurrentLevel(level);

            // 初始化汽车
            this.carManager?.initCars(level);
        } else {
            console.error(`Invalid level: ${level}. Level must be between 1 and ${this.mapManager?.getTotalLevels()}`);
        }    }



    // 主菜单按钮回调函数
    public onMainMenuToLevelClick(): void {
        // 默认进入第一关
        this.setCurrentLevel(1);
        this.uiManager?.showLevelOnly();
    }

    // 主菜单打开设置界面，不关闭主菜单
    public onMainMenuToSettingClick(): void {
        // 将主菜单设置按钮事件绑定到UIManager的对应方法
        this.uiManager.onMainMenuToSettingClick();
    }

    // 关卡界面按钮回调函数
    public onLevelToLevelClearClick(): void {
        this.uiManager?.showLevelClearOnly();
    }

    // 关卡界面打开设置界面，不关闭关卡界面
    public onLevelToSettingClick(): void {
        // 将关卡界面设置按钮事件绑定到UIManager的对应方法
        this.uiManager?.onLevelToSettingClick();
    }

    // 通关界面按钮回调函数
    public onLevelClearToLevelClick(): void {
        // 进入下一关
        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= this.mapManager?.getTotalLevels()) {
            this.setCurrentLevel(nextLevel);
        } else {
            // 没有下一关时，设置为超出范围的关卡以显示"无限关卡"
            this.currentLevel = nextLevel;
            this.uiManager?.updateLevelLabel(nextLevel, this.mapManager?.getTotalLevels() || 0);
        }
        this.uiManager?.showLevelOnly();
    }

    // 设置界面按钮回调函数
    public onSettingToConfirmClick(): void {
        // 将设置界面确认按钮事件绑定到UIManager的对应方法
        this.uiManager?.onSettingToConfirmClick();
    }

    public onSettingSoundToggle(): void {
        if (this.audioManagerNode) {
            this.audioManagerNode.getComponent(CarAudio).onClickAudio();
        }
    }

    public onSettingClose(): void {
        // 将设置界面关闭按钮事件绑定到UIManager的对应方法
        this.uiManager?.onSettingClose();
    }

    // 二次确认界面按钮回调函数
    public onConfirmToMainMenuClick(): void {
        // 将二次确认界面返回主菜单按钮事件绑定到UIManager的对应方法
        this.uiManager?.onConfirmToMainMenuClick();
    }

    public onConfirmCancelClick(): void {
        // 将二次确认界面取消按钮事件绑定到UIManager的对应方法
        this.uiManager?.onConfirmCancelClick();
    }

    // 关卡完成时调用
    public onLevelClear(): void {
        // 将关卡完成时事件绑定到UIManager的对应方法
        this.uiManager?.showLevelClearOnly();
    }

    update(deltaTime: number) {
        // 可以在这里添加需要每帧更新的逻辑
    }
}